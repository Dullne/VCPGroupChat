const assert = require('assert');
const Database = require('better-sqlite3');

const SessionService = require('../src/services/sessionService');

function createTestDb() {
    const db = new Database(':memory:');
    db.exec(`
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
            speaker_person_id TEXT,
            speaker_membership_id TEXT,
            content_text TEXT,
            content_json TEXT NOT NULL,
            round_index INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );
        CREATE TABLE ephemeral_roles (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            avatar TEXT DEFAULT '',
            role_spec_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            promoted_core_role_id TEXT
        );
        CREATE TABLE session_reflections (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            summary TEXT NOT NULL,
            source_message_count INTEGER NOT NULL DEFAULT 0,
            candidate_count INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );
        CREATE TABLE memory_candidates (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            reflection_id TEXT,
            scope TEXT NOT NULL DEFAULT 'shared',
            target_role_id TEXT,
            target_role_name TEXT,
            target_person_id TEXT,
            target_membership_id TEXT,
            memory_owner_type TEXT NOT NULL DEFAULT 'legacy_role',
            memory_owner_id TEXT,
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
    `);
    db.prepare(`
        INSERT INTO sessions (id, profile_id, title, created_at, updated_at)
        VALUES ('sess_test', 'profile_test', '测试会话', '2026-06-25T00:00:00.000Z', '2026-06-25T00:00:00.000Z')
    `).run();
    return db;
}

function testFiltersRuntimeOnlyMemoryCandidates() {
    const db = createTestDb();
    const service = new SessionService(db);

    const result = service.createSessionReflection('sess_test', {
        summary: '测试候选过滤',
        source_message_count: 2,
        candidates: [
            {
                scope: 'shared',
                notebook: '公共',
                content: '犬娘小吉 在群聊中形成的可复用结论：我是犬娘小吉，负责补全背景和区分记忆边界。当前无可用共享记忆，私有记忆暂不可读。',
                reason: '来自最近角色回复，需用户确认后才进入长期记忆写入流程。'
            },
            {
                scope: 'shared',
                notebook: '公共',
                content: '猫娘小克 在群聊中形成的可复用结论：项目启动时需要先确认真实入口、端口和业务后端边界。',
                reason: '来自最近角色回复，需用户确认后才进入长期记忆写入流程。'
            }
        ]
    });

    assert.strictEqual(result.candidates.length, 1);
    assert.match(result.candidates[0].content, /项目启动时需要先确认真实入口/);

    const reflection = db.prepare('SELECT candidate_count FROM session_reflections WHERE id = ?')
        .get(result.reflection.id);
    assert.strictEqual(reflection.candidate_count, 1);
}

testFiltersRuntimeOnlyMemoryCandidates();
console.log('sessionService.memoryCandidates.test.js passed');
