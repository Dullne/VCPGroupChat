const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DEFAULT_TEAM = {
    id: 'team_default',
    name: '默认团队',
    description: '系统默认人物池，保留历史群聊入口与长期人物。'
};
const LEGACY_DEFAULT_TEAM_DESCRIPTION = '默认团队，承载历史群组模板。';
const DEPRECATED_2026_06_DEFAULT_TEAM_DESCRIPTION = [
    '系统默认',
    '角色',
    '池，保留历史群聊入口与核心',
    '角色。'
].join('');

const DEFAULT_PROFILE = {
    id: 'maid_team_default',
    team_id: DEFAULT_TEAM.id,
    name: '女仆协作组',
    description: '默认的群聊协作组，保留当前六位长期人物。',
    mode: 'sequential',
    invite_prompt: '接下来请作为{{role_name}}发言，只回答你职责内的内容。',
    mode_options: {},
    group_prompt:
        '这里是当前用户的专家协作聊天室。现在是{{Date}}{{time}}。你们不是抢答型陪聊，而是一个会协作的多角色系统：谁最相关谁先答，其他角色只在自己真的有增量价值时再补充。允许通过完整角色名直接点名交接，例如 @龙娘小娜、@猫娘小克。面对复杂任务时，先拆解问题，再分工，再汇总。团队共享记忆如下：{{公共日记本}}。系统工具列表：{{VCPFluxGen}} {{VCPSciCalculator}}。{{VarDailyNoteCreate}}'
};

const DEFAULT_PROFILE_MEMBERS = [
    { role_id: 'nana_orchestrator', role_name: '龙娘小娜', role_order: 10 },
    { role_id: 'ke_researcher', role_name: '猫娘小克', role_order: 20 },
    { role_id: 'ji_archivist', role_name: '犬娘小吉', role_order: 30 },
    { role_id: 'bing_critic', role_name: '蛇娘小冰', role_order: 40 },
    { role_id: 'yu_writer', role_name: '鸟娘小雨', role_order: 50 },
    { role_id: 'jue_toolsmith', role_name: '狼娘小绝', role_order: 60 }
];

let dbInstance = null;

function nowIso() {
    return new Date().toISOString();
}

function tableHasColumn(db, tableName, columnName) {
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
    return columns.some(column => column.name === columnName);
}

function ensureSchemaMigrations(db) {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS teams (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            created_at TEXT NOT NULL
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS team_members (
            team_id TEXT NOT NULL,
            role_id TEXT NOT NULL,
            role_name TEXT DEFAULT '',
            role_order INTEGER NOT NULL DEFAULT 0,
            enabled INTEGER NOT NULL DEFAULT 1,
            PRIMARY KEY (team_id, role_id)
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS role_templates (
            id TEXT PRIMARY KEY,
            source TEXT NOT NULL,
            external_id TEXT,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            template_content TEXT DEFAULT '',
            defaults_json TEXT NOT NULL DEFAULT '{}',
            metadata_json TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS persons (
            id TEXT PRIMARY KEY,
            display_name TEXT NOT NULL,
            source_template_id TEXT,
            legacy_role_id TEXT,
            identity_kind TEXT NOT NULL DEFAULT 'person',
            description TEXT DEFAULT '',
            personality TEXT DEFAULT '',
            emotional_style TEXT DEFAULT '',
            voice_style TEXT DEFAULT '',
            relationship_profile_json TEXT NOT NULL DEFAULT '{}',
            memory_json TEXT NOT NULL DEFAULT '{}',
            model_preferences_json TEXT NOT NULL DEFAULT '{}',
            lifecycle_status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS team_person_members (
            team_id TEXT NOT NULL,
            person_id TEXT NOT NULL,
            person_name TEXT DEFAULT '',
            member_order INTEGER NOT NULL DEFAULT 0,
            enabled INTEGER NOT NULL DEFAULT 1,
            legacy_role_id TEXT,
            PRIMARY KEY (team_id, person_id)
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS group_person_members (
            profile_id TEXT NOT NULL,
            person_id TEXT NOT NULL,
            person_name TEXT DEFAULT '',
            group_alias TEXT DEFAULT '',
            member_order INTEGER NOT NULL DEFAULT 0,
            enabled INTEGER NOT NULL DEFAULT 1,
            speaking_policy_json TEXT NOT NULL DEFAULT '{}',
            legacy_role_id TEXT,
            PRIMARY KEY (profile_id, person_id)
        )
    `).run();

    if (!tableHasColumn(db, 'group_profiles', 'team_id')) {
        db.prepare(`ALTER TABLE group_profiles ADD COLUMN team_id TEXT`).run();
    }
    if (!tableHasColumn(db, 'group_profiles', 'mode')) {
        db.prepare(`ALTER TABLE group_profiles ADD COLUMN mode TEXT`).run();
    }
    if (!tableHasColumn(db, 'group_profiles', 'invite_prompt')) {
        db.prepare(`ALTER TABLE group_profiles ADD COLUMN invite_prompt TEXT`).run();
    }
    if (!tableHasColumn(db, 'group_profiles', 'mode_options_json')) {
        db.prepare(`ALTER TABLE group_profiles ADD COLUMN mode_options_json TEXT`).run();
    }
    if (!tableHasColumn(db, 'session_messages', 'speaker_person_id')) {
        db.prepare(`ALTER TABLE session_messages ADD COLUMN speaker_person_id TEXT`).run();
    }
    if (!tableHasColumn(db, 'session_messages', 'speaker_membership_id')) {
        db.prepare(`ALTER TABLE session_messages ADD COLUMN speaker_membership_id TEXT`).run();
    }
    if (!tableHasColumn(db, 'memory_candidates', 'target_person_id')) {
        db.prepare(`ALTER TABLE memory_candidates ADD COLUMN target_person_id TEXT`).run();
    }
    if (!tableHasColumn(db, 'memory_candidates', 'target_membership_id')) {
        db.prepare(`ALTER TABLE memory_candidates ADD COLUMN target_membership_id TEXT`).run();
    }
    if (!tableHasColumn(db, 'memory_candidates', 'memory_owner_type')) {
        db.prepare(`ALTER TABLE memory_candidates ADD COLUMN memory_owner_type TEXT NOT NULL DEFAULT 'legacy_role'`).run();
    }
    if (!tableHasColumn(db, 'memory_candidates', 'memory_owner_id')) {
        db.prepare(`ALTER TABLE memory_candidates ADD COLUMN memory_owner_id TEXT`).run();
    }

    db.prepare(`
        UPDATE group_profiles
        SET team_id = @defaultTeamId
        WHERE team_id IS NULL OR TRIM(team_id) = ''
    `).run({ defaultTeamId: DEFAULT_TEAM.id });

    db.prepare(`
        UPDATE group_profiles
        SET mode = 'sequential'
        WHERE mode IS NULL OR TRIM(mode) = ''
    `).run();

    db.prepare(`
        UPDATE group_profiles
        SET invite_prompt = ''
        WHERE invite_prompt IS NULL
    `).run();

    db.prepare(`
        UPDATE group_profiles
        SET mode_options_json = '{}'
        WHERE mode_options_json IS NULL OR TRIM(mode_options_json) = ''
    `).run();

    db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_group_profiles_team_id
        ON group_profiles(team_id)
    `).run();

    db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_team_members_team_id
        ON team_members(team_id)
    `).run();

    // Backfill team members from existing enabled group-profile members.
    db.prepare(`
        INSERT OR IGNORE INTO team_members (team_id, role_id, role_name, role_order, enabled)
        SELECT
            gp.team_id,
            gpm.role_id,
            MAX(COALESCE(gpm.role_name, gpm.role_id)) AS role_name,
            MIN(COALESCE(gpm.role_order, 0)) AS role_order,
            1 AS enabled
        FROM group_profile_members gpm
        JOIN group_profiles gp ON gp.id = gpm.profile_id
        WHERE gpm.enabled = 1
          AND gp.team_id IS NOT NULL
          AND TRIM(gp.team_id) <> ''
        GROUP BY gp.team_id, gpm.role_id
    `).run();

    const migrationTime = nowIso();
    db.prepare(`
        DELETE FROM team_person_members
        WHERE person_id IN (
            SELECT legacy_person.id
            FROM persons legacy_person
            WHERE legacy_person.identity_kind = 'legacy_person'
              AND legacy_person.legacy_role_id IS NOT NULL
              AND TRIM(legacy_person.legacy_role_id) <> ''
              AND EXISTS (
                  SELECT 1
                  FROM persons real_person
                  WHERE real_person.legacy_role_id = legacy_person.legacy_role_id
                    AND real_person.identity_kind <> 'legacy_person'
              )
        )
    `).run();

    db.prepare(`
        DELETE FROM group_person_members
        WHERE person_id IN (
            SELECT legacy_person.id
            FROM persons legacy_person
            WHERE legacy_person.identity_kind = 'legacy_person'
              AND legacy_person.legacy_role_id IS NOT NULL
              AND TRIM(legacy_person.legacy_role_id) <> ''
              AND EXISTS (
                  SELECT 1
                  FROM persons real_person
                  WHERE real_person.legacy_role_id = legacy_person.legacy_role_id
                    AND real_person.identity_kind <> 'legacy_person'
              )
        )
    `).run();

    db.prepare(`
        DELETE FROM persons
        WHERE identity_kind = 'legacy_person'
          AND legacy_role_id IS NOT NULL
          AND TRIM(legacy_role_id) <> ''
          AND EXISTS (
              SELECT 1
              FROM persons real_person
              WHERE real_person.legacy_role_id = persons.legacy_role_id
                AND real_person.identity_kind <> 'legacy_person'
          )
    `).run();

    db.prepare(`
        INSERT OR IGNORE INTO persons
        (id, display_name, source_template_id, legacy_role_id, identity_kind, description, personality, emotional_style, voice_style, relationship_profile_json, memory_json, model_preferences_json, lifecycle_status, created_at, updated_at)
        SELECT
            'person_legacy_' || role_id,
            COALESCE(NULLIF(TRIM(role_name), ''), role_id),
            NULL,
            role_id,
            'legacy_person',
            '',
            '',
            '',
            '',
            '{}',
            json_object('privateNotebook', COALESCE(NULLIF(TRIM(role_name), ''), role_id)),
            '{}',
            'active',
            @now,
            @now
        FROM (
            SELECT role_id, MAX(role_name) AS role_name
            FROM team_members
            WHERE enabled = 1
            GROUP BY role_id
        )
        WHERE role_id IS NOT NULL
          AND TRIM(role_id) <> ''
          AND NOT EXISTS (
              SELECT 1
              FROM persons existing_person
              WHERE existing_person.legacy_role_id = role_id
          )
    `).run({ now: migrationTime });

    const duplicateRoleIds = db.prepare(`
        SELECT legacy_role_id, COUNT(*) AS cnt
        FROM persons
        WHERE identity_kind <> 'legacy_person'
          AND legacy_role_id IS NOT NULL
          AND TRIM(legacy_role_id) <> ''
        GROUP BY legacy_role_id
        HAVING cnt > 1
    `).all();
    if (duplicateRoleIds.length) {
        console.warn(
            '[DB Migration] Multiple real persons share the same legacy_role_id — only the earliest-created person per role_id will receive team/group membership during migration. Affected role IDs:',
            duplicateRoleIds.map(d => `${d.legacy_role_id}(×${d.cnt})`).join(', ')
        );
    }

    db.prepare(`
        INSERT OR IGNORE INTO team_person_members
        (team_id, person_id, person_name, member_order, enabled, legacy_role_id)
        SELECT
            tm.team_id,
            person.id,
            COALESCE(NULLIF(TRIM(person.display_name), ''), NULLIF(TRIM(tm.role_name), ''), tm.role_id),
            tm.role_order,
            tm.enabled,
            tm.role_id
        FROM team_members tm
        JOIN persons person
          ON person.id = (
              SELECT existing_person.id
              FROM persons existing_person
              WHERE existing_person.legacy_role_id = tm.role_id
                AND existing_person.identity_kind <> 'legacy_person'
              ORDER BY existing_person.created_at ASC, existing_person.id ASC
              LIMIT 1
          )
        WHERE tm.enabled = 1
          AND tm.role_id IS NOT NULL
          AND TRIM(tm.role_id) <> ''
    `).run();

    db.prepare(`
        INSERT OR IGNORE INTO group_person_members
        (profile_id, person_id, person_name, group_alias, member_order, enabled, speaking_policy_json, legacy_role_id)
        SELECT
            gpm.profile_id,
            person.id,
            COALESCE(NULLIF(TRIM(person.display_name), ''), NULLIF(TRIM(gpm.role_name), ''), gpm.role_id),
            COALESCE(NULLIF(TRIM(person.display_name), ''), NULLIF(TRIM(gpm.role_name), ''), gpm.role_id),
            gpm.role_order,
            gpm.enabled,
            '{}',
            gpm.role_id
        FROM group_profile_members gpm
        JOIN persons person
          ON person.id = (
              SELECT existing_person.id
              FROM persons existing_person
              WHERE existing_person.legacy_role_id = gpm.role_id
                AND existing_person.identity_kind <> 'legacy_person'
              ORDER BY existing_person.created_at ASC, existing_person.id ASC
              LIMIT 1
          )
        WHERE gpm.enabled = 1
          AND gpm.role_id IS NOT NULL
          AND TRIM(gpm.role_id) <> ''
    `).run();

    db.prepare(`
        INSERT OR IGNORE INTO team_person_members
        (team_id, person_id, person_name, member_order, enabled, legacy_role_id)
        SELECT
            team_id,
            'person_legacy_' || role_id,
            COALESCE(NULLIF(TRIM(role_name), ''), role_id),
            role_order,
            enabled,
            role_id
        FROM team_members
        WHERE enabled = 1
          AND role_id IS NOT NULL
          AND TRIM(role_id) <> ''
          AND NOT EXISTS (
              SELECT 1
              FROM persons existing_person
              WHERE existing_person.legacy_role_id = role_id
                AND existing_person.id <> 'person_legacy_' || role_id
          )
    `).run();

    db.prepare(`
        INSERT OR IGNORE INTO group_person_members
        (profile_id, person_id, person_name, group_alias, member_order, enabled, speaking_policy_json, legacy_role_id)
        SELECT
            profile_id,
            'person_legacy_' || role_id,
            COALESCE(NULLIF(TRIM(role_name), ''), role_id),
            COALESCE(NULLIF(TRIM(role_name), ''), role_id),
            role_order,
            enabled,
            '{}',
            role_id
        FROM group_profile_members
        WHERE enabled = 1
          AND role_id IS NOT NULL
          AND TRIM(role_id) <> ''
          AND NOT EXISTS (
              SELECT 1
              FROM persons existing_person
              WHERE existing_person.legacy_role_id = role_id
                AND existing_person.id <> 'person_legacy_' || role_id
          )
    `).run();

    db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_persons_legacy_role_id
        ON persons(legacy_role_id)
    `).run();

    db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_persons_source_template_id
        ON persons(source_template_id)
    `).run();

    db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_team_person_members_team_id
        ON team_person_members(team_id)
    `).run();

    db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_group_person_members_profile_id
        ON group_person_members(profile_id)
    `).run();

    db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_memory_candidates_target_person
        ON memory_candidates(target_person_id)
    `).run();
}

function ensureDefaultSeed(db) {
    const teamExists = db
        .prepare('SELECT id FROM teams WHERE id = ?')
        .get(DEFAULT_TEAM.id);

    if (!teamExists) {
        db.prepare(`
            INSERT INTO teams (id, name, description, created_at)
            VALUES (@id, @name, @description, @created_at)
        `).run({
            ...DEFAULT_TEAM,
            created_at: nowIso()
        });
    }

    db.prepare(`
        UPDATE teams
        SET description = @description
        WHERE description IN (@legacyDescription, @deprecatedDescription)
    `).run({
        description: DEFAULT_TEAM.description,
        legacyDescription: LEGACY_DEFAULT_TEAM_DESCRIPTION,
        deprecatedDescription: DEPRECATED_2026_06_DEFAULT_TEAM_DESCRIPTION
    });

    const profileExists = db
        .prepare('SELECT id FROM group_profiles WHERE id = ?')
        .get(DEFAULT_PROFILE.id);

    if (!profileExists) {
        db.prepare(`
            INSERT INTO group_profiles (id, team_id, name, description, mode, invite_prompt, mode_options_json, group_prompt, created_at)
            VALUES (@id, @team_id, @name, @description, @mode, @invite_prompt, @mode_options_json, @group_prompt, @created_at)
        `).run({
            ...DEFAULT_PROFILE,
            mode_options_json: JSON.stringify(DEFAULT_PROFILE.mode_options || {}),
            created_at: nowIso()
        });
    } else {
        db.prepare(`
            UPDATE group_profiles
            SET
                team_id = CASE
                    WHEN team_id IS NULL OR TRIM(team_id) = '' THEN @team_id
                    ELSE team_id
                END,
                mode = CASE
                    WHEN mode IS NULL OR TRIM(mode) = '' THEN @mode
                    ELSE mode
                END,
                invite_prompt = COALESCE(invite_prompt, @invite_prompt)
                ,
                mode_options_json = CASE
                    WHEN mode_options_json IS NULL OR TRIM(mode_options_json) = '' THEN @mode_options_json
                    ELSE mode_options_json
                END
            WHERE id = @id
        `).run({
            id: DEFAULT_PROFILE.id,
            team_id: DEFAULT_PROFILE.team_id,
            mode: DEFAULT_PROFILE.mode,
            invite_prompt: DEFAULT_PROFILE.invite_prompt,
            mode_options_json: JSON.stringify(DEFAULT_PROFILE.mode_options || {})
        });
    }

    const insertMember = db.prepare(`
        INSERT OR IGNORE INTO group_profile_members
        (profile_id, role_id, role_name, role_order, enabled)
        VALUES (@profile_id, @role_id, @role_name, @role_order, 1)
    `);

    const insertTeamMember = db.prepare(`
        INSERT OR IGNORE INTO team_members
        (team_id, role_id, role_name, role_order, enabled)
        VALUES (@team_id, @role_id, @role_name, @role_order, 1)
    `);

    for (const member of DEFAULT_PROFILE_MEMBERS) {
        insertMember.run({
            profile_id: DEFAULT_PROFILE.id,
            ...member
        });

        insertTeamMember.run({
            team_id: DEFAULT_TEAM.id,
            ...member
        });
    }
}

function getDatabase() {
    if (dbInstance) {
        return dbInstance;
    }

    const dataDir = path.join(__dirname, '..', '..', 'data');
    fs.mkdirSync(dataDir, { recursive: true });
    const dbPath = process.env.GROUPCHAT_DB_PATH || path.join(dataDir, 'groupchat.db');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    dbInstance = new Database(dbPath);
    dbInstance.exec(schemaSql);
    ensureSchemaMigrations(dbInstance);
    ensureDefaultSeed(dbInstance);

    return dbInstance;
}

module.exports = {
    DEFAULT_TEAM,
    DEFAULT_PROFILE,
    ensureDefaultSeed,
    ensureSchemaMigrations,
    getDatabase,
    nowIso
};
