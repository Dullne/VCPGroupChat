const assert = require('assert');

const Orchestrator = require('../src/services/orchestrator');
const RoleStudioService = require('../src/services/roleStudioService');
const VcpCoreClient = require('../src/services/vcpCoreClient');

function testVcpCoreClientDoesNotExposeModelCalls() {
    const client = new VcpCoreClient({
        baseUrl: 'http://127.0.0.1:6005',
        apiKey: 'test-key'
    });

    assert.strictEqual(client.chatCompletions, undefined);
    assert.strictEqual(client.chatCompletionsStream, undefined);
}

async function testRoleStudioUsesBackendLlmClientForDrafts() {
    const calls = [];
    const vcpCoreClient = {
        async listRoles() {
            calls.push(['core:listRoles']);
            return [];
        },
        async chatCompletions() {
            throw new Error('VCP core must not be used for role studio model calls');
        }
    };
    const llmClient = {
        async chatCompletions(payload) {
            calls.push(['llm:chatCompletions', payload.model]);
            return {
                model: payload.model,
                choices: [
                    {
                        message: {
                            content: JSON.stringify({
                                name: '测试角色',
                                description: '负责测试边界',
                                persona: '你是测试角色。',
                                responsibilities: ['验证模型配置隔离', '生成角色草稿', '记录边界风险'],
                                template: '角色名称：测试角色\n角色定位：负责测试边界',
                                privateNotebook: '测试角色',
                                knowledgeNotebook: '测试角色的知识',
                                invitePrompt: '请作为测试角色发言。',
                                collaborationGuide: '先说明发现，再给出建议。',
                                voiceStyle: '简洁',
                                model: ''
                            })
                        }
                    }
                ]
            };
        }
    };
    const service = new RoleStudioService({
        sessionService: {
            getSession() {
                return null;
            },
            getProfile() {
                return null;
            }
        },
        vcpCoreClient,
        llmClient,
        sourceService: {
            getRuntimeConfig() {
                return {};
            },
            async buildGenerationContext() {
                return { engine: 'vcp_default', warnings: [] };
            }
        }
    });

    const result = await service.draftRole({
        idea: '测试配置边界',
        preferredModel: 'backend/model'
    });

    assert.strictEqual(result.meta.selected_model, 'backend/model');
    assert.strictEqual(result.draft.name, '测试角色');
    assert.deepStrictEqual(calls, [
        ['core:listRoles'],
        ['llm:chatCompletions', 'backend/model']
    ]);
}

async function testOrchestratorUsesBackendLlmClientForRoleStreams() {
    const addedMessages = [];
    const emitted = [];
    const vcpCoreClient = {
        async listRoles() {
            return [];
        },
        async *chatCompletionsStream() {
            throw new Error('VCP core must not be used for group chat model calls');
        }
    };
    const llmClient = {
        async *chatCompletionsStream(payload) {
            assert.strictEqual(payload.model, 'backend/model');
            yield { delta: 'backend ' };
            yield { delta: 'reply' };
            yield { done: true };
        }
    };
    const orchestrator = new Orchestrator({
        sessionService: {
            addMessage(sessionId, message) {
                addedMessages.push([sessionId, message]);
                return { id: 'msg_backend_reply', ...message };
            }
        },
        vcpCoreClient,
        llmClient,
        userName: '用户',
        userPrompt: ''
    });

    const result = await orchestrator.executeRoleStream({
        sessionId: 'session_1',
        role: {
            id: 'role_1',
            name: '测试角色',
            role_spec: {
                model: 'backend/model',
                template_content: '你是测试角色。'
            }
        },
        profile: {
            id: 'profile_1',
            name: '测试群组',
            mode: 'sequential',
            mode_options: {},
            invite_prompt: '',
            group_prompt: ''
        },
        phase: '',
        roundIndex: 1,
        fullHistory: [],
        emit: async (event, payload) => {
            emitted.push([event, payload.delta]);
        }
    });

    assert.strictEqual(result.selectedModel, 'backend/model');
    assert.strictEqual(result.savedMessage.content.text, 'backend reply');
    assert.deepStrictEqual(emitted, [
        ['role_delta', 'backend '],
        ['role_delta', 'reply']
    ]);
    assert.deepStrictEqual(addedMessages.map(item => [item[0], item[1].content.text]), [
        ['session_1', 'backend reply']
    ]);
}

async function withEnv(overrides, fn) {
    const previous = {};
    for (const key of Object.keys(overrides)) {
        previous[key] = process.env[key];
        if (overrides[key] === undefined) {
            delete process.env[key];
        } else {
            process.env[key] = overrides[key];
        }
    }

    try {
        await fn();
    } finally {
        for (const [key, value] of Object.entries(previous)) {
            if (value === undefined) {
                delete process.env[key];
            } else {
                process.env[key] = value;
            }
        }
    }
}

async function testModelOrderIgnoresCoreCompatibilityEnvNames() {
    await withEnv({
        DEFAULT_ROLE_MODEL: 'core/default-model',
        GROUPCHAT_CORE_MODEL: 'core/groupchat-model',
        ROLE_CORE_FALLBACK_MODELS: 'core/fallback-a,core/fallback-b',
        GROUPCHAT_ROLE_MODEL: 'backend/primary-model',
        GROUPCHAT_ROLE_FALLBACK_MODELS: 'backend/fallback-a,backend/fallback-b',
        GROUPCHAT_DISABLED_MODELS: undefined
    }, async () => {
        const orchestrator = new Orchestrator({
            sessionService: null,
            vcpCoreClient: null,
            llmClient: null,
            userName: '用户',
            userPrompt: ''
        });

        const models = orchestrator.buildModelOrder({});

        assert(models.includes('backend/primary-model'));
        assert(models.includes('backend/fallback-a'));
        assert(models.includes('backend/fallback-b'));
        assert(!models.includes('core/default-model'));
        assert(!models.includes('core/groupchat-model'));
        assert(!models.includes('core/fallback-a'));
        assert(!models.includes('core/fallback-b'));
    });
}

async function run() {
    testVcpCoreClientDoesNotExposeModelCalls();
    await testRoleStudioUsesBackendLlmClientForDrafts();
    await testOrchestratorUsesBackendLlmClientForRoleStreams();
    await testModelOrderIgnoresCoreCompatibilityEnvNames();
    console.log('backendCoreModelBoundary.test.js passed');
}

run().catch(error => {
    console.error(error);
    process.exit(1);
});
