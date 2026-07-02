const assert = require('assert');

const RoleStudioService = require('../src/services/roleStudioService');

function buildDraftCompletion(name = '独立人物设计师') {
    return {
        model: 'test/model',
        choices: [
            {
                message: {
                    content: JSON.stringify({
                        name,
                        description: '负责把一句话需求转成可长期保存的人物草稿',
                        persona: `你是${name}。你会围绕用户需求设计职责边界清晰的人物。`,
                        responsibilities: ['识别人物定位', '拆分职责边界', '生成可保存草稿'],
                        template: `人物名称：${name}\n人物定位：长期人物草稿设计\n核心职责：\n- 识别人物定位\n- 拆分职责边界\n- 生成可保存草稿\n协作要求：不假设自己属于某个群组。`,
                        privateNotebook: name,
                        knowledgeNotebook: `${name}的知识`,
                        invitePrompt: `请作为${name}发言。`,
                        collaborationGuide: '先说明判断，再给出可执行建议。',
                        voiceStyle: '清晰',
                        model: ''
                    })
                }
            }
        ]
    };
}

function createService(overrides = {}) {
    const captured = {
        messages: null,
        calls: []
    };
    const service = new RoleStudioService({
        sessionService: overrides.sessionService || {
            getSession() {
                captured.calls.push('session:getSession');
                return { id: 'session-current', profile_id: 'profile-current', ephemeral_roles: [] };
            },
            getProfile() {
                captured.calls.push('session:getProfile');
                return {
                    id: 'profile-current',
                    name: '当前群组',
                    description: '用于验证群组补位',
                    group_prompt: '请互相补位。',
                    members: []
                };
            }
        },
        vcpCoreClient: overrides.vcpCoreClient || {
            async listRoles() {
                captured.calls.push('core:listRoles');
                return [];
            }
        },
        llmClient: {
            async chatCompletions(payload) {
                captured.calls.push('llm:chatCompletions');
                captured.messages = payload.messages;
                return buildDraftCompletion(overrides.draftName);
            }
        },
        sourceService: {
            getRuntimeConfig() {
                return {};
            },
            async buildGenerationContext() {
                return { engine: 'vcp_default', warnings: [] };
            }
        }
    });

    return { service, captured };
}

async function testDefaultContextModeDoesNotUseImplicitGroupOrSession() {
    const { service, captured } = createService();

    const result = await service.draftRole({
        idea: '创建一个长期存在的产品技术统筹',
        sessionId: 'session-current',
        profileId: 'profile-current',
        preferredModel: 'test/model'
    });

    const userPrompt = captured.messages.find(message => message.role === 'user')?.content || '';
    const systemPrompt = captured.messages.find(message => message.role === 'system')?.content || '';

    assert.equal(result.meta.context_mode, 'none');
    assert.equal(result.meta.profile_id, null);
    assert.equal(result.meta.profile_name, null);
    assert.equal(result.meta.session_id, null);
    assert(!captured.calls.includes('session:getSession'));
    assert(!captured.calls.includes('session:getProfile'));
    assert(!captured.calls.includes('core:listRoles'));
    assert.match(userPrompt, /不参考群组/);
    assert.doesNotMatch(userPrompt, /当前群聊配置/);
    assert.doesNotMatch(userPrompt, /当前已存在的角色/);
    assert.doesNotMatch(userPrompt, /默认群组提示/);
    assert.doesNotMatch(systemPrompt, /现有角色职责高度重复/);
}

async function testGroupProfileContextModeUsesExplicitProfileMembers() {
    const { service, captured } = createService({
        sessionService: {
            getSession(sessionId) {
                captured.calls.push(`session:getSession:${sessionId}`);
                return {
                    id: sessionId,
                    profile_id: 'profile-current',
                    ephemeral_roles: [
                        {
                            id: 'ephemeral-1',
                            name: '临时观察员',
                            description: '临时补充风险观察',
                            role_spec: {
                                responsibilities: ['观察风险']
                            }
                        }
                    ]
                };
            },
            getProfile(profileId) {
                captured.calls.push(`session:getProfile:${profileId}`);
                return {
                    id: profileId,
                    name: '产品技术协作室',
                    description: '聚焦产品技术决策',
                    group_prompt: '需要形成可执行技术路线。',
                    members: [
                        {
                            role_id: 'role-pm',
                            role_name: '产品负责人',
                            enabled: true
                        }
                    ]
                };
            }
        },
        vcpCoreClient: {
            async listRoles() {
                captured.calls.push('core:listRoles');
                return [
                    {
                        id: 'role-pm',
                        name: '产品负责人',
                        description: '负责产品判断',
                        role_spec: {
                            responsibilities: ['梳理需求']
                        }
                    }
                ];
            }
        },
        draftName: '技术路线设计师'
    });

    const result = await service.draftRole({
        idea: '给当前群组补一个技术路线设计师',
        sessionId: 'session-current',
        profileId: 'profile-current',
        contextMode: 'group_profile',
        preferredModel: 'test/model'
    });

    const userPrompt = captured.messages.find(message => message.role === 'user')?.content || '';
    const systemPrompt = captured.messages.find(message => message.role === 'system')?.content || '';

    assert.equal(result.meta.context_mode, 'group_profile');
    assert.equal(result.meta.profile_id, 'profile-current');
    assert.equal(result.meta.profile_name, '产品技术协作室');
    assert.equal(result.meta.session_id, 'session-current');
    assert.match(userPrompt, /当前群聊配置：产品技术协作室/);
    assert.match(userPrompt, /产品负责人/);
    assert.match(userPrompt, /临时观察员/);
    assert.match(systemPrompt, /当前参考群组/);
    assert(captured.calls.includes('core:listRoles'));
}

async function run() {
    await testDefaultContextModeDoesNotUseImplicitGroupOrSession();
    await testGroupProfileContextModeUsesExplicitProfileMembers();
    console.log('roleStudioContextMode.test.js passed');
}

run().catch(error => {
    console.error(error);
    process.exit(1);
});
