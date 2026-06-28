const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const {
    ensureSchemaMigrations,
    ensureDefaultSeed
} = require('../src/db/database');
const PersonIdentityService = require('../src/services/personIdentityService');

function createLegacyDb() {
    const db = new Database(':memory:');
    db.exec(`
        CREATE TABLE teams (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            created_at TEXT NOT NULL
        );
        CREATE TABLE group_profiles (
            id TEXT PRIMARY KEY,
            team_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            mode TEXT NOT NULL DEFAULT 'sequential',
            invite_prompt TEXT DEFAULT '',
            mode_options_json TEXT NOT NULL DEFAULT '{}',
            group_prompt TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE team_members (
            team_id TEXT NOT NULL,
            role_id TEXT NOT NULL,
            role_name TEXT DEFAULT '',
            role_order INTEGER NOT NULL DEFAULT 0,
            enabled INTEGER NOT NULL DEFAULT 1,
            PRIMARY KEY (team_id, role_id)
        );
        CREATE TABLE group_profile_members (
            profile_id TEXT NOT NULL,
            role_id TEXT NOT NULL,
            role_name TEXT DEFAULT '',
            role_order INTEGER NOT NULL DEFAULT 0,
            enabled INTEGER NOT NULL DEFAULT 1,
            PRIMARY KEY (profile_id, role_id)
        );
        CREATE TABLE sessions (
            id TEXT PRIMARY KEY,
            profile_id TEXT NOT NULL,
            title TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE session_messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            speaker_id TEXT,
            speaker_name TEXT,
            content_text TEXT,
            content_json TEXT NOT NULL,
            round_index INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );
        CREATE TABLE memory_candidates (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            reflection_id TEXT,
            scope TEXT NOT NULL DEFAULT 'shared',
            target_role_id TEXT,
            target_role_name TEXT,
            notebook TEXT NOT NULL DEFAULT '公共',
            content TEXT NOT NULL,
            reason TEXT DEFAULT '',
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            confirmed_at TEXT,
            confirmed_by TEXT,
            core_write_status TEXT NOT NULL DEFAULT 'not_wired',
            core_write_result_json TEXT NOT NULL DEFAULT '{}'
        );
        INSERT INTO teams (id, name, description, created_at)
        VALUES ('team_test', '测试团队', '', '2026-06-27T00:00:00.000Z');
        INSERT INTO group_profiles (id, team_id, name, group_prompt, created_at)
        VALUES ('profile_test', 'team_test', '测试群组', 'prompt', '2026-06-27T00:00:00.000Z');
        INSERT INTO team_members (team_id, role_id, role_name, role_order, enabled)
        VALUES ('team_test', 'software_architect', '软件架构师', 10, 1);
        INSERT INTO group_profile_members (profile_id, role_id, role_name, role_order, enabled)
        VALUES ('profile_test', 'software_architect', '软件架构师', 10, 1);
    `);
    return db;
}

function hasColumn(db, table, column) {
    return db.prepare(`PRAGMA table_info(${table})`).all()
        .some(row => row.name === column);
}

function testSchemaMigrationAddsPersonIdentityTablesAndColumns() {
    const db = createLegacyDb();
    ensureSchemaMigrations(db);
    ensureDefaultSeed(db);

    assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'role_templates'").get());
    assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'persons'").get());
    assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'team_person_members'").get());
    assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'group_person_members'").get());

    assert.strictEqual(hasColumn(db, 'session_messages', 'speaker_person_id'), true);
    assert.strictEqual(hasColumn(db, 'session_messages', 'speaker_membership_id'), true);
    assert.strictEqual(hasColumn(db, 'memory_candidates', 'target_person_id'), true);
    assert.strictEqual(hasColumn(db, 'memory_candidates', 'target_membership_id'), true);
    assert.strictEqual(hasColumn(db, 'memory_candidates', 'memory_owner_type'), true);
    assert.strictEqual(hasColumn(db, 'memory_candidates', 'memory_owner_id'), true);

    const person = db.prepare('SELECT * FROM persons WHERE legacy_role_id = ?').get('software_architect');
    assert.ok(person);
    assert.strictEqual(person.display_name, '软件架构师');
    assert.strictEqual(person.identity_kind, 'legacy_person');

    const teamMember = db.prepare('SELECT * FROM team_person_members WHERE team_id = ? AND person_id = ?')
        .get('team_test', person.id);
    assert.ok(teamMember);
    assert.strictEqual(teamMember.legacy_role_id, 'software_architect');

    const groupMember = db.prepare('SELECT * FROM group_person_members WHERE profile_id = ? AND person_id = ?')
        .get('profile_test', person.id);
    assert.ok(groupMember);
    assert.strictEqual(groupMember.legacy_role_id, 'software_architect');
}

testSchemaMigrationAddsPersonIdentityTablesAndColumns();

function testSchemaSqlBootstrapsLegacyDbBeforeMigrations() {
    const db = createLegacyDb();
    const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'src', 'db', 'schema.sql'), 'utf8');

    assert.doesNotThrow(() => db.exec(schemaSql));
    ensureSchemaMigrations(db);

    assert.strictEqual(hasColumn(db, 'memory_candidates', 'target_person_id'), true);
    assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_memory_candidates_target_person'").get());
}

testSchemaSqlBootstrapsLegacyDbBeforeMigrations();

function testMigrationDoesNotCreateLegacyPersonWhenRuntimeRoleAlreadyBelongsToRealPerson() {
    const db = createLegacyDb();
    ensureSchemaMigrations(db);

    db.prepare(`
        INSERT INTO persons
        (id, display_name, source_template_id, legacy_role_id, identity_kind, description, personality, emotional_style, voice_style, relationship_profile_json, memory_json, model_preferences_json, lifecycle_status, created_at, updated_at)
        VALUES ('person_real_architect', '真实架构师', 'tpl_architect', 'software_architect', 'person', '', '', '', '', '{}', '{}', '{}', 'active', '2026-06-27T00:00:00.000Z', '2026-06-27T00:00:00.000Z')
    `).run();

    ensureSchemaMigrations(db);

    const owners = db.prepare(`
        SELECT id, identity_kind
        FROM persons
        WHERE legacy_role_id = ?
        ORDER BY id ASC
    `).all('software_architect');

    assert.deepStrictEqual(owners, [
        { id: 'person_real_architect', identity_kind: 'person' }
    ]);
    assert.strictEqual(
        db.prepare('SELECT 1 FROM team_person_members WHERE person_id = ?')
            .get('person_legacy_software_architect'),
        undefined
    );
    assert.strictEqual(
        db.prepare('SELECT 1 FROM group_person_members WHERE person_id = ?')
            .get('person_legacy_software_architect'),
        undefined
    );
}

testMigrationDoesNotCreateLegacyPersonWhenRuntimeRoleAlreadyBelongsToRealPerson();
function testCanCreateTemplateAndMultiplePeopleFromIt() {
    const db = createLegacyDb();
    ensureSchemaMigrations(db);
    ensureDefaultSeed(db);
    const service = new PersonIdentityService(db);

    const template = service.upsertRoleTemplate({
        id: 'tpl_ai_engineer',
        source: 'agency_agents',
        external_id: 'engineering/ai-engineer',
        name: 'AI Engineer',
        description: 'AI capability template',
        defaults: { model: 'gpt-5' },
        metadata: { imported_from: 'agency-agents/engineering' }
    });
    const ada = service.createPersonFromTemplate(template.id, {
        display_name: 'Ada',
        personality: 'calm builder',
        memory: { privateNotebook: 'Ada' }
    });
    const lin = service.createPersonFromTemplate(template.id, {
        display_name: 'Lin',
        personality: 'skeptical reviewer',
        memory: { privateNotebook: 'Lin' }
    });

    assert.notStrictEqual(ada.id, lin.id);
    assert.strictEqual(ada.source_template_id, template.id);
    assert.strictEqual(lin.source_template_id, template.id);
    assert.strictEqual(ada.memory.privateNotebook, 'Ada');
    assert.strictEqual(lin.memory.privateNotebook, 'Lin');
}

function testCanAttachPersonToTeamAndProfileWithoutRemovingLegacyRoleFields() {
    const db = createLegacyDb();
    ensureSchemaMigrations(db);
    ensureDefaultSeed(db);
    const service = new PersonIdentityService(db);
    const person = service.createPerson({
        display_name: '小林',
        memory: { privateNotebook: '小林' }
    });

    service.addTeamPersonMember('team_test', person.id, { member_order: 20 });
    service.addGroupPersonMember('profile_test', person.id, { member_order: 20, group_alias: '林' });

    const teamMembers = service.listTeamPersonMembers('team_test');
    const groupMembers = service.listGroupPersonMembers('profile_test');

    assert.ok(teamMembers.some(member => member.person_id === person.id && member.person.display_name === '小林'));
    assert.ok(groupMembers.some(member => member.person_id === person.id && member.group_alias === '林'));
}

function testMappedPersonMembershipSyncsLegacyRuntimeTables() {
    const db = createLegacyDb();
    ensureSchemaMigrations(db);
    ensureDefaultSeed(db);
    const service = new PersonIdentityService(db);
    const person = service.createPerson({
        display_name: '评审员甲',
        legacy_role_id: 'runtime_reviewer',
        memory: { privateNotebook: '评审员甲' }
    });

    service.addTeamPersonMember('team_test', person.id, { member_order: 30 });
    service.addGroupPersonMember('profile_test', person.id, { member_order: 30, group_alias: '评审' });

    const teamRuntimeMember = db.prepare(`
        SELECT *
        FROM team_members
        WHERE team_id = ? AND role_id = ? AND enabled = 1
    `).get('team_test', 'runtime_reviewer');
    assert.ok(teamRuntimeMember, 'mapped person membership keeps legacy team runtime membership active');
    assert.strictEqual(teamRuntimeMember.role_name, '评审员甲');

    const groupRuntimeMember = db.prepare(`
        SELECT *
        FROM group_profile_members
        WHERE profile_id = ? AND role_id = ? AND enabled = 1
    `).get('profile_test', 'runtime_reviewer');
    assert.ok(groupRuntimeMember, 'mapped person membership keeps legacy group runtime membership active');
    assert.strictEqual(groupRuntimeMember.role_name, '评审员甲');
}

function testRemovingMappedPersonMembershipDisablesProductAndLegacyRows() {
    const db = createLegacyDb();
    ensureSchemaMigrations(db);
    ensureDefaultSeed(db);
    const service = new PersonIdentityService(db);
    const person = service.createPerson({
        display_name: '评审员乙',
        legacy_role_id: 'runtime_reviewer_b',
        memory: { privateNotebook: '评审员乙' }
    });

    service.addTeamPersonMember('team_test', person.id, { member_order: 40 });
    service.addGroupPersonMember('profile_test', person.id, { member_order: 40, group_alias: '评审乙' });

    service.removeGroupPersonMember('profile_test', person.id);
    assert.strictEqual(
        db.prepare('SELECT enabled FROM group_person_members WHERE profile_id = ? AND person_id = ?')
            .get('profile_test', person.id).enabled,
        0
    );
    assert.strictEqual(
        db.prepare('SELECT enabled FROM group_profile_members WHERE profile_id = ? AND role_id = ?')
            .get('profile_test', 'runtime_reviewer_b').enabled,
        0
    );

    service.removeTeamPersonMember('team_test', person.id);
    assert.strictEqual(
        db.prepare('SELECT enabled FROM team_person_members WHERE team_id = ? AND person_id = ?')
            .get('team_test', person.id).enabled,
        0
    );
    assert.strictEqual(
        db.prepare('SELECT enabled FROM team_members WHERE team_id = ? AND role_id = ?')
            .get('team_test', 'runtime_reviewer_b').enabled,
        0
    );
}

function testBindingRuntimeRoleBackfillsExistingPersonMemberships() {
    const db = createLegacyDb();
    ensureSchemaMigrations(db);
    ensureDefaultSeed(db);
    const service = new PersonIdentityService(db);
    const person = service.createPerson({
        display_name: '未映射人物',
        memory: { privateNotebook: '未映射人物' }
    });

    service.addTeamPersonMember('team_test', person.id, { member_order: 50 });
    service.addGroupPersonMember('profile_test', person.id, { member_order: 60, group_alias: '未映射' });

    assert.strictEqual(
        db.prepare('SELECT 1 FROM team_members WHERE team_id = ? AND role_id = ? AND enabled = 1')
            .get('team_test', 'runtime_unmapped_person'),
        undefined
    );

    const updatedPerson = service.bindPersonRuntimeRole(person.id, {
        role_id: 'runtime_unmapped_person',
        role_name: '运行时未映射人物'
    });

    assert.strictEqual(updatedPerson.legacy_role_id, 'runtime_unmapped_person');
    assert.strictEqual(
        db.prepare('SELECT legacy_role_id FROM team_person_members WHERE team_id = ? AND person_id = ?')
            .get('team_test', person.id).legacy_role_id,
        'runtime_unmapped_person'
    );
    assert.strictEqual(
        db.prepare('SELECT legacy_role_id FROM group_person_members WHERE profile_id = ? AND person_id = ?')
            .get('profile_test', person.id).legacy_role_id,
        'runtime_unmapped_person'
    );

    const teamRuntimeMember = db.prepare(`
        SELECT *
        FROM team_members
        WHERE team_id = ? AND role_id = ? AND enabled = 1
    `).get('team_test', 'runtime_unmapped_person');
    assert.ok(teamRuntimeMember, 'runtime role binding backfills active team runtime membership');
    assert.strictEqual(teamRuntimeMember.role_name, '未映射人物');

    const groupRuntimeMember = db.prepare(`
        SELECT *
        FROM group_profile_members
        WHERE profile_id = ? AND role_id = ? AND enabled = 1
    `).get('profile_test', 'runtime_unmapped_person');
    assert.ok(groupRuntimeMember, 'runtime role binding backfills active group runtime membership');
    assert.strictEqual(groupRuntimeMember.role_name, '未映射人物');
}

function testRebindingRuntimeRoleDisablesPreviousRuntimeMemberships() {
    const db = createLegacyDb();
    ensureSchemaMigrations(db);
    ensureDefaultSeed(db);
    const service = new PersonIdentityService(db);
    const person = service.createPerson({
        display_name: '改绑人物',
        legacy_role_id: 'runtime_old_person',
        memory: { privateNotebook: '改绑人物' }
    });

    service.addTeamPersonMember('team_test', person.id, { member_order: 70 });
    service.addGroupPersonMember('profile_test', person.id, { member_order: 80, group_alias: '改绑' });

    service.bindPersonRuntimeRole(person.id, {
        role_id: 'runtime_new_person',
        role_name: '新的运行时人物'
    });

    assert.strictEqual(
        db.prepare('SELECT enabled FROM team_members WHERE team_id = ? AND role_id = ?')
            .get('team_test', 'runtime_old_person').enabled,
        0
    );
    assert.strictEqual(
        db.prepare('SELECT enabled FROM group_profile_members WHERE profile_id = ? AND role_id = ?')
            .get('profile_test', 'runtime_old_person').enabled,
        0
    );
    assert.strictEqual(
        db.prepare('SELECT enabled FROM team_members WHERE team_id = ? AND role_id = ?')
            .get('team_test', 'runtime_new_person').enabled,
        1
    );
    assert.strictEqual(
        db.prepare('SELECT enabled FROM group_profile_members WHERE profile_id = ? AND role_id = ?')
            .get('profile_test', 'runtime_new_person').enabled,
        1
    );
}

testCanCreateTemplateAndMultiplePeopleFromIt();
testCanAttachPersonToTeamAndProfileWithoutRemovingLegacyRoleFields();
testMappedPersonMembershipSyncsLegacyRuntimeTables();
testRemovingMappedPersonMembershipDisablesProductAndLegacyRows();
testBindingRuntimeRoleBackfillsExistingPersonMemberships();
testRebindingRuntimeRoleDisablesPreviousRuntimeMemberships();
console.log('personIdentityService.test.js schema migration checks passed');
console.log('personIdentityService.test.js service checks passed');
