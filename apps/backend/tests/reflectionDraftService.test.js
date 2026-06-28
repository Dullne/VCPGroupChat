const assert = require('assert');

const { buildSessionReflectionDraft } = require('../src/services/reflectionDraftService');

function testRoleRepliesDefaultToPrivateNotebookWhenConfigured() {
    const draft = buildSessionReflectionDraft({
        messages: [
            {
                role: 'user',
                content: { text: '记住这个偏好。' }
            },
            {
                role: 'assistant',
                speaker_id: 'ji_archivist',
                speaker_name: '犬娘小吉',
                content: { text: '用户偏好先看真实证据链，再决定是否改代码；涉及共享工作区时，需要先确认锁、状态和影响范围。' }
            }
        ]
    }, {
        roles: [
            {
                id: 'ji_archivist',
                name: '犬娘小吉',
                memory: {
                    privateNotebook: '小吉',
                    knowledgeNotebook: '小吉的知识',
                    sharedNotebooks: ['公共']
                }
            }
        ]
    });

    assert.strictEqual(draft.candidates.length, 1);
    assert.strictEqual(draft.candidates[0].scope, 'private');
    assert.strictEqual(draft.candidates[0].notebook, '小吉');
    assert.strictEqual(draft.candidates[0].target_role_id, 'ji_archivist');
    assert.strictEqual(draft.candidates[0].target_role_name, '犬娘小吉');
}

function testUnconfiguredRoleRepliesFallbackToSharedNotebook() {
    const draft = buildSessionReflectionDraft({
        messages: [
            {
                role: 'user',
                content: { text: '总结一下。' }
            },
            {
                role: 'assistant',
                speaker_id: 'unknown_role',
                speaker_name: '未知角色',
                content: { text: '这是一条足够长的候选内容，用于验证没有角色记忆配置时仍进入公共。' }
            }
        ]
    }, {
        roles: []
    });

    assert.strictEqual(draft.candidates.length, 1);
    assert.strictEqual(draft.candidates[0].scope, 'shared');
    assert.strictEqual(draft.candidates[0].notebook, '公共');
}

function testPersonSpeakerProducesPersonTargetedPrivateCandidate() {
    const draft = buildSessionReflectionDraft({
        messages: [
            {
                role: 'assistant',
                speaker_id: 'ai_engineer_template',
                speaker_name: 'Ada',
                speaker_person_id: 'person_ada',
                speaker_membership_id: 'membership_ada',
                content: { text: '人物身份应该拥有长期记忆，模板只提供能力和初始提示，不能直接沉淀私有记忆。' }
            }
        ]
    }, {
        persons: [
            {
                id: 'person_ada',
                display_name: 'Ada',
                memory: { privateNotebook: 'Ada' }
            }
        ],
        roles: [
            {
                id: 'ai_engineer_template',
                name: 'AI Engineer',
                source: 'agency_agents'
            }
        ]
    });

    assert.strictEqual(draft.candidates.length, 1);
    assert.strictEqual(draft.candidates[0].scope, 'private');
    assert.strictEqual(draft.candidates[0].target_person_id, 'person_ada');
    assert.strictEqual(draft.candidates[0].target_membership_id, 'membership_ada');
    assert.strictEqual(draft.candidates[0].memory_owner_type, 'person');
    assert.strictEqual(draft.candidates[0].memory_owner_id, 'person_ada');
    assert.strictEqual(draft.candidates[0].notebook, 'Ada');
}

testRoleRepliesDefaultToPrivateNotebookWhenConfigured();
testUnconfiguredRoleRepliesFallbackToSharedNotebook();
testPersonSpeakerProducesPersonTargetedPrivateCandidate();
console.log('reflectionDraftService.test.js passed');
