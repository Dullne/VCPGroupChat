const assert = require('assert');
const Database = require('better-sqlite3');

const SessionService = require('../src/services/sessionService');
const { ensureSchemaMigrations } = require('../src/db/database');

function createDb() {
    const db = new Database(':memory:');
    db.exec(`
        CREATE TABLE teams (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT DEFAULT '', created_at TEXT NOT NULL);
        CREATE TABLE group_profiles (id TEXT PRIMARY KEY, team_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT DEFAULT '', mode TEXT NOT NULL DEFAULT 'sequential', invite_prompt TEXT DEFAULT '', mode_options_json TEXT NOT NULL DEFAULT '{}', group_prompt TEXT NOT NULL, created_at TEXT NOT NULL);
        CREATE TABLE team_members (team_id TEXT NOT NULL, role_id TEXT NOT NULL, role_name TEXT DEFAULT '', role_order INTEGER NOT NULL DEFAULT 0, enabled INTEGER NOT NULL DEFAULT 1, PRIMARY KEY (team_id, role_id));
        CREATE TABLE group_profile_members (profile_id TEXT NOT NULL, role_id TEXT NOT NULL, role_name TEXT DEFAULT '', role_order INTEGER NOT NULL DEFAULT 0, enabled INTEGER NOT NULL DEFAULT 1, PRIMARY KEY (profile_id, role_id));
        CREATE TABLE sessions (id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, title TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
        CREATE TABLE session_messages (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, role TEXT NOT NULL, speaker_id TEXT, speaker_name TEXT, content_text TEXT, content_json TEXT NOT NULL, round_index INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
        CREATE TABLE session_reflections (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, summary TEXT NOT NULL, source_message_count INTEGER NOT NULL DEFAULT 0, candidate_count INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
        CREATE TABLE memory_candidates (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, reflection_id TEXT, scope TEXT NOT NULL DEFAULT 'shared', target_role_id TEXT, target_role_name TEXT, notebook TEXT NOT NULL DEFAULT '公共', content TEXT NOT NULL, reason TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, confirmed_at TEXT, confirmed_by TEXT, core_write_status TEXT NOT NULL DEFAULT 'not_wired', core_write_result_json TEXT NOT NULL DEFAULT '{}');
        CREATE TABLE ephemeral_roles (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT DEFAULT '', avatar TEXT DEFAULT '', role_spec_json TEXT NOT NULL, created_at TEXT NOT NULL, promoted_core_role_id TEXT);
        INSERT INTO teams (id, name, created_at) VALUES ('team_test', '测试团队', '2026-06-27T00:00:00.000Z');
        INSERT INTO group_profiles (id, team_id, name, group_prompt, created_at) VALUES ('profile_test', 'team_test', '测试群组', 'prompt', '2026-06-27T00:00:00.000Z');
        INSERT INTO sessions (id, profile_id, title, created_at, updated_at) VALUES ('sess_test', 'profile_test', '测试会话', '2026-06-27T00:00:00.000Z', '2026-06-27T00:00:00.000Z');
    `);
    ensureSchemaMigrations(db);
    return db;
}

function testSessionMessagesPersistSpeakerPersonIdentity() {
    const db = createDb();
    const service = new SessionService(db);
    const message = service.addMessage('sess_test', {
        role: 'assistant',
        speaker_id: 'ai_engineer_template',
        speaker_name: 'Ada',
        speaker_person_id: 'person_ada',
        speaker_membership_id: 'membership_ada',
        content: { text: '这是一条人物身份消息。' }
    });

    assert.strictEqual(message.speaker_person_id, 'person_ada');
    assert.strictEqual(message.speaker_membership_id, 'membership_ada');

    const session = service.getSession('sess_test');
    assert.strictEqual(session.messages[0].speaker_person_id, 'person_ada');
    assert.strictEqual(session.messages[0].speaker_membership_id, 'membership_ada');
}

function testMemoryCandidatesPersistTargetPersonAndOwnerFields() {
    const db = createDb();
    const service = new SessionService(db);
    const result = service.createSessionReflection('sess_test', {
        summary: '测试人物记忆候选',
        candidates: [{
            scope: 'private',
            target_role_id: 'ai_engineer_template',
            target_role_name: 'AI Engineer',
            target_person_id: 'person_ada',
            target_membership_id: 'membership_ada',
            memory_owner_type: 'person',
            memory_owner_id: 'person_ada',
            notebook: 'Ada',
            content: 'Ada 在群聊中形成的可复用结论：人物身份应该拥有长期记忆，而模板不应该直接拥有私有记忆。',
            reason: '验证人物记忆 owner 字段'
        }]
    });

    assert.strictEqual(result.candidates.length, 1);
    assert.strictEqual(result.candidates[0].target_person_id, 'person_ada');
    assert.strictEqual(result.candidates[0].target_membership_id, 'membership_ada');
    assert.strictEqual(result.candidates[0].memory_owner_type, 'person');
    assert.strictEqual(result.candidates[0].memory_owner_id, 'person_ada');
}

testSessionMessagesPersistSpeakerPersonIdentity();
testMemoryCandidatesPersistTargetPersonAndOwnerFields();
console.log('sessionService.personIdentity.test.js passed');
