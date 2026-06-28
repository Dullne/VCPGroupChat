const assert = require('assert');
const Database = require('better-sqlite3');

const SessionService = require('../src/services/sessionService');

function createTestDb() {
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
        INSERT INTO teams (id, name, created_at)
        VALUES ('team_test', 'Test Team', '2026-06-27T00:00:00.000Z');
    `);
    return db;
}

function testCreatesProfileWithNaturalRandomAliasAndPreservesModeOptions() {
    const db = createTestDb();
    const service = new SessionService(db);

    const profile = service.createProfile({
        id: 'profile_mode_alias_create',
        team_id: 'team_test',
        name: 'Mode Alias Create',
        mode: 'natural_random',
        mode_options: {
            mention_mode: 'additive',
            random_min_speakers: '3',
            random_max_speakers: '2',
            consensus_required: true,
            acceptance_task: 96,
            conversation_policy: 'project'
        },
        group_prompt: 'Keep group profile mode and options.'
    });

    assert.strictEqual(profile.mode, 'naturerandom');
    assert.deepStrictEqual(profile.mode_options, {
        mention_mode: 'additive',
        random_min_speakers: 2,
        random_max_speakers: 3,
        consensus_required: true,
        acceptance_task: 96,
        conversation_policy: 'project'
    });

    const stored = service.getProfile(profile.id);
    assert.strictEqual(stored.mode, 'naturerandom');
    assert.strictEqual(stored.mode_options.consensus_required, true);
    assert.strictEqual(stored.mode_options.acceptance_task, 96);
}

function testUpdatesProfileWithNaturalRandomAliasAndPreservesModeOptions() {
    const db = createTestDb();
    const service = new SessionService(db);

    const profile = service.createProfile({
        id: 'profile_mode_alias_update',
        team_id: 'team_test',
        name: 'Mode Alias Update',
        mode: 'natural random',
        mode_options: {
            consensus_required: true,
            conversation_policy: 'project',
            acceptance_task: 96
        },
        group_prompt: 'Initial prompt.'
    });

    const updated = service.updateProfile(profile.id, {
        mode: 'natural-random',
        mode_options: {
            mention_mode: 'ignore',
            random_min_speakers: 1,
            random_max_speakers: 5,
            consensus_required: true,
            acceptance_task: 96
        }
    });

    assert.strictEqual(updated.mode, 'naturerandom');
    assert.deepStrictEqual(updated.mode_options, {
        mention_mode: 'ignore',
        random_min_speakers: 1,
        random_max_speakers: 5,
        consensus_required: true,
        conversation_policy: 'project',
        acceptance_task: 96
    });
}

testCreatesProfileWithNaturalRandomAliasAndPreservesModeOptions();
testUpdatesProfileWithNaturalRandomAliasAndPreservesModeOptions();
console.log('sessionService.profileMode.test.js passed');
