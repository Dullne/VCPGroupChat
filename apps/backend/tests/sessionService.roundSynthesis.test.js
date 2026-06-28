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
        CREATE TABLE round_syntheses (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            round_index INTEGER NOT NULL,
            conversation_policy TEXT NOT NULL,
            consensus_state TEXT NOT NULL,
            source_message_ids_json TEXT NOT NULL DEFAULT '[]',
            participant_states_json TEXT NOT NULL DEFAULT '[]',
            memory_deposition_json TEXT NOT NULL DEFAULT '{}',
            project_assets_json TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(session_id, round_index)
        );
    `);
    db.prepare(`
        INSERT INTO sessions (id, profile_id, title, created_at, updated_at)
        VALUES ('sess_test', 'profile_test', '测试会话', '2026-06-25T00:00:00.000Z', '2026-06-25T00:00:00.000Z')
    `).run();
    db.prepare(`
        INSERT INTO session_messages
        (id, session_id, role, speaker_id, speaker_name, content_text, content_json, round_index, created_at)
        VALUES
        ('msg_user', 'sess_test', 'user', 'user', '用户', '普通聊天也要沉淀记忆。', '{"text":"普通聊天也要沉淀记忆。"}', 2, '2026-06-25T00:01:00.000Z'),
        ('msg_role', 'sess_test', 'assistant', 'role_a', '角色A', '我参考上一条发言补充。', '{"text":"我参考上一条发言补充。"}', 2, '2026-06-25T00:01:01.000Z')
    `).run();
    return db;
}

function testPersistsCasualRoundMemoryWithoutProjectAssets() {
    const db = createTestDb();
    const service = new SessionService(db);

    const synthesis = service.upsertRoundSynthesis('sess_test', {
        round_index: 2,
        conversation_policy: 'casual',
        consensus_state: 'exploration_only',
        source_message_ids: ['msg_user', 'msg_role'],
        participant_states: [
            {
                role_id: 'role_a',
                role_name: '角色A',
                participation_state: 'spoke',
                stance: 'adds_context',
                referenced_message_ids: ['msg_user']
            },
            {
                role_id: 'role_b',
                role_name: '角色B',
                participation_state: 'silent',
                silence_reason: 'no_incremental_value'
            }
        ],
        memory_deposition: {
            mode: 'lightweight',
            items: [
                {
                    type: 'preference',
                    content: '普通聊天也应该参考前文并沉淀有价值记忆。',
                    confirmation_required: false,
                    source_message_ids: ['msg_user', 'msg_role']
                }
            ]
        },
        project_assets: {
            decisions: [],
            risks: [],
            tasks: []
        }
    });

    assert.strictEqual(synthesis.session_id, 'sess_test');
    assert.strictEqual(synthesis.round_index, 2);
    assert.strictEqual(synthesis.conversation_policy, 'casual');
    assert.strictEqual(synthesis.consensus_state, 'exploration_only');
    assert.deepStrictEqual(synthesis.source_message_ids, ['msg_user', 'msg_role']);
    assert.strictEqual(synthesis.participant_states[0].referenced_message_ids[0], 'msg_user');
    assert.strictEqual(synthesis.participant_states[1].participation_state, 'silent');
    assert.strictEqual(synthesis.memory_deposition.items[0].confirmation_required, false);
    assert.deepStrictEqual(synthesis.project_assets.decisions, []);

    const rows = service.listRoundSyntheses('sess_test');
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].id, synthesis.id);
}

function testRejectsProjectAssetsForOrdinaryRound() {
    const db = createTestDb();
    const service = new SessionService(db);

    assert.throws(
        () => service.upsertRoundSynthesis('sess_test', {
            round_index: 2,
            conversation_policy: 'ordinary',
            consensus_state: 'exploration_only',
            memory_deposition: {
                items: [
                    {
                        type: 'preference',
                        content: '普通聊天仍允许记忆沉淀。',
                        source_message_ids: ['msg_user']
                    }
                ]
            },
            project_assets: {
                decisions: [
                    {
                        title: '普通聊天不应直接形成项目决策',
                        status: 'accepted'
                    }
                ],
                recommended_tasks: [
                    {
                        title: '不应从普通聊天直接创建项目任务'
                    }
                ]
            }
        }),
        error => {
            assert.match(error.message, /casual round synthesis cannot include project_assets/);
            assert.strictEqual(error.status, 400);
            assert.deepStrictEqual(error.payload.fields, ['decisions', 'recommended_tasks']);
            assert.strictEqual(error.payload.conversation_policy, 'casual');
            return true;
        }
    );
    assert.strictEqual(service.listRoundSyntheses('sess_test').length, 0);
}

function testUpsertsRoundSynthesisBySessionAndRound() {
    const db = createTestDb();
    const service = new SessionService(db);

    const first = service.upsertRoundSynthesis('sess_test', {
        round_index: 2,
        conversation_policy: 'casual',
        consensus_state: 'exploration_only',
        memory_deposition: { items: [] },
        project_assets: { decisions: [] }
    });
    const second = service.upsertRoundSynthesis('sess_test', {
        round_index: 2,
        conversation_policy: 'project',
        consensus_state: 'consensus_with_caveats',
        memory_deposition: { items: [] },
        project_assets: {
            decisions: [
                {
                    title: '项目讨论需要保留分歧后再收敛',
                    status: 'accepted'
                }
            ]
        }
    });

    assert.strictEqual(second.id, first.id);
    assert.strictEqual(second.conversation_policy, 'project');
    assert.strictEqual(second.project_assets.decisions[0].status, 'accepted');
    assert.strictEqual(service.listRoundSyntheses('sess_test').length, 1);
}

function testConfirmsProjectAssetsForProjectRound() {
    const db = createTestDb();
    const service = new SessionService(db);

    service.upsertRoundSynthesis('sess_test', {
        round_index: 2,
        conversation_policy: 'project',
        consensus_state: 'consensus_with_caveats',
        memory_deposition: { items: [] },
        project_assets: {
            decisions: [
                {
                    title: '确认后的项目资产才能进入 hcc backlog',
                    status: 'accepted'
                }
            ],
            recommended_tasks: [
                {
                    title: 'Wire project assets confirmation to hcc bridge',
                    team_role: 'integration',
                    source_message_ids: ['msg_role']
                }
            ]
        }
    });

    const confirmed = service.confirmRoundSynthesisProjectAssets('sess_test', 2, {
        confirmedBy: '项目负责人'
    });

    assert.strictEqual(confirmed.conversation_policy, 'project');
    assert.strictEqual(confirmed.project_assets.confirmed, true);
    assert.strictEqual(confirmed.project_assets.confirmed_by, '项目负责人');
    assert.match(confirmed.project_assets.confirmed_at, /^\d{4}-\d{2}-\d{2}T/);
    assert.strictEqual(
        confirmed.project_assets.recommended_tasks[0].title,
        'Wire project assets confirmation to hcc bridge'
    );
}

function testRejectsProjectAssetsConfirmationWithoutRecommendedTasks() {
    const db = createTestDb();
    const service = new SessionService(db);

    service.upsertRoundSynthesis('sess_test', {
        round_index: 2,
        conversation_policy: 'decision',
        consensus_state: 'consensus',
        memory_deposition: { items: [] },
        project_assets: {
            decisions: [
                {
                    title: '有决策但没有可执行任务',
                    status: 'accepted'
                }
            ],
            recommended_tasks: []
        }
    });

    assert.throws(
        () => service.confirmRoundSynthesisProjectAssets('sess_test', 2, {
            confirmedBy: '项目负责人'
        }),
        /confirmed project_assets contain no recommended_tasks/
    );
}

testPersistsCasualRoundMemoryWithoutProjectAssets();
testRejectsProjectAssetsForOrdinaryRound();
testUpsertsRoundSynthesisBySessionAndRound();
testConfirmsProjectAssetsForProjectRound();
testRejectsProjectAssetsConfirmationWithoutRecommendedTasks();
console.log('sessionService.roundSynthesis.test.js passed');
