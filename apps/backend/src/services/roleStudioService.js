const { DEFAULT_PROFILE } = require('../db/database');
const RoleStudioSourceService = require('./roleStudioSourceService');

const DEFAULT_SHARED_NOTEBOOK = '公共';
const DEFAULT_FAST_MODELS = [
    'bytedance-seed/seed-1.6-flash',
    'qwen/qwen3.5-flash-02-23',
    'z-ai/glm-4.7-flash',
    'qwen/qwen3.6-plus-preview:free'
];

function summarizeInline(value, maxLength = 220) {
    const normalized = String(value || '').replace(/\s+/g, ' ').trim();
    if (!normalized) {
        return '';
    }
    if (normalized.length <= maxLength) {
        return normalized;
    }
    return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

function extractCompletionText(completion) {
    const content = completion?.choices?.[0]?.message?.content;
    if (typeof content === 'string') {
        return content.trim();
    }

    if (Array.isArray(content)) {
        return content
            .map(item => {
                if (typeof item === 'string') {
                    return item;
                }
                if (item?.type === 'text') {
                    return item.text || '';
                }
                return '';
            })
            .join('\n')
            .trim();
    }

    return '';
}

function extractJsonObject(text) {
    const raw = String(text || '').trim();
    if (!raw) {
        throw new Error('role studio returned empty content');
    }

    try {
        return JSON.parse(raw);
    } catch (_error) {
        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) {
            throw new Error('role studio did not return JSON');
        }
        return JSON.parse(match[0]);
    }
}

function normalizeStringArray(value, maxItems = 6) {
    const list = Array.isArray(value)
        ? value
        : String(value || '')
            .split('\n')
            .map(item => item.trim())
            .filter(Boolean);

    return [...new Set(
        list
            .map(item => String(item || '').replace(/\s+/g, ' ').trim())
            .filter(item => item && item.length >= 2 && !/^[\d.\-_*()]+$/.test(item))
    )].slice(0, maxItems);
}

function suggestRoleNameFromIdea(idea) {
    const explicitPatterns = [
        /(?:叫|名为|名称是|名字是)[“"「]?([^，。；、“"」]{2,24})/u,
        /[“"「]([^”"」]{2,24})[”"」]/u
    ];

    for (const pattern of explicitPatterns) {
        const match = String(idea || '').match(pattern);
        if (match?.[1]) {
            return match[1].trim();
        }
    }

    if (/产品|需求/.test(idea) && /代码|开发|技术|工程/.test(idea)) {
        return '产品技术统筹';
    }
    if (/研究|调研|分析/.test(idea)) {
        return '研究分析师';
    }
    if (/写作|文案|文章|总结|表达/.test(idea)) {
        return '内容写作师';
    }
    if (/运营|增长|营销|转化/.test(idea)) {
        return '增长运营师';
    }
    if (/协调|推进|管理|交付|统筹/.test(idea)) {
        return '协作推进官';
    }
    if (/教育|课程|老师|教学/.test(idea)) {
        return '学习教练';
    }

    return '自定义角色';
}

function deriveResponsibilitiesFromIdea(idea) {
    const responsibilities = [];

    if (/产品|需求|路线图|用户/.test(idea)) {
        responsibilities.push('拆解需求并输出产品判断');
    }
    if (/代码|开发|技术|工程|架构/.test(idea)) {
        responsibilities.push('评估技术实现路径与工程风险');
    }
    if (/研究|调研|分析|信息/.test(idea)) {
        responsibilities.push('补充调研信息并形成结构化结论');
    }
    if (/写作|文案|文章|总结|表达/.test(idea)) {
        responsibilities.push('整理表达并输出清晰成稿');
    }
    if (/推进|协调|管理|交付|统筹/.test(idea)) {
        responsibilities.push('推进任务分工与协作交付');
    }
    if (/教育|课程|老师|教学/.test(idea)) {
        responsibilities.push('按循序渐进方式引导学习与理解');
    }

    responsibilities.push('与其他角色协作，只提供增量价值');
    return [...new Set(responsibilities)];
}

function sanitizeText(value, maxLength = 4000) {
    return String(value || '')
        .replace(/\r/g, '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .slice(0, maxLength);
}

function normalizeNotebookName(value, fallback) {
    const candidate = sanitizeText(value, 40)
        .replace(/\s+/g, ' ')
        .trim();

    if (!candidate) {
        return fallback;
    }

    if (candidate === DEFAULT_SHARED_NOTEBOOK) {
        return fallback;
    }

    if (candidate.length > 18) {
        return fallback;
    }

    if (/[，,、;；/]/.test(candidate)) {
        return fallback;
    }

    return candidate;
}

function isUsableTemplate(value) {
    const normalized = sanitizeText(value, 4000);
    if (!normalized) {
        return false;
    }
    if (normalized.length < 60) {
        return false;
    }
    if (!/[\n：:-]/.test(normalized)) {
        return false;
    }
    return true;
}

function buildDefaultTemplate({ name, description, responsibilities, collaborationGuide, persona, voiceStyle }) {
    const lines = [
        `角色名称：${name}`,
        `角色定位：${description}`,
        '',
        '核心职责：',
        ...(responsibilities || []).map(item => `- ${item}`),
        '',
        '协作要求：',
        '- 你不是群组管理器，不负责创建群组、切换会话或做业务层按钮操作',
        '- 优先补位，不重复当前团队已覆盖的角色能力',
        `- ${collaborationGuide || '先识别自己该答的部分，再给出具体、可执行、可交接的内容'}`,
        voiceStyle ? `- 表达风格：${voiceStyle}` : null,
        '',
        '认知设定：',
        persona
    ];

    return lines.filter(Boolean).join('\n');
}

function normalizeRoleDraft(parsedDraft, idea) {
    const normalizedIdea = sanitizeText(idea, 300) || sanitizeText(parsedDraft?.description || '', 300);
    const fallbackName = suggestRoleNameFromIdea(normalizedIdea);
    const name = sanitizeText(parsedDraft?.name || fallbackName, 40) || '自定义角色';

    const responsibilities = normalizeStringArray(
        parsedDraft?.responsibilities,
        6
    );
    const finalResponsibilities = responsibilities.length
        ? responsibilities
        : deriveResponsibilitiesFromIdea(normalizedIdea);

    const description = sanitizeText(parsedDraft?.description || normalizedIdea, 240) || normalizedIdea;
    const collaborationGuide = sanitizeText(
        parsedDraft?.collaborationGuide || parsedDraft?.collaboration_guide || '',
        240
    ) || '只回答自己最擅长的部分，先补位，再给出可执行结论。';

    const voiceStyle = sanitizeText(
        parsedDraft?.voiceStyle || parsedDraft?.voice_style || '',
        80
    );

    const persona = sanitizeText(
        parsedDraft?.persona || `你是${name}。${description}。在群聊协作中，请优先识别问题结构、明确你的专业边界，并只输出对当前讨论有增量价值的内容。`,
        1200
    );

    const privateNotebook = normalizeNotebookName(
        parsedDraft?.privateNotebook || parsedDraft?.private_notebook,
        name
    );
    const knowledgeNotebook = normalizeNotebookName(
        parsedDraft?.knowledgeNotebook || parsedDraft?.knowledge_notebook,
        `${name}的知识`
    );

    const invitePrompt = sanitizeText(
        parsedDraft?.invitePrompt || parsedDraft?.invite_prompt || `接下来请作为${name}发言。优先按照你的职责范围回答，不要输出额外聊天标识头。`,
        220
    );

    const model = sanitizeText(parsedDraft?.model || '', 120);

    const fallbackTemplate = buildDefaultTemplate({
        name,
        description,
        responsibilities: finalResponsibilities,
        collaborationGuide,
        persona,
        voiceStyle
    });
    const rawTemplate = sanitizeText(parsedDraft?.template || parsedDraft?.template_content || '', 4000);
    const template = isUsableTemplate(rawTemplate) ? rawTemplate : fallbackTemplate;

    return {
        name,
        description,
        persona,
        responsibilities: finalResponsibilities,
        template,
        privateNotebook,
        knowledgeNotebook,
        invitePrompt,
        collaborationGuide,
        voiceStyle,
        model
    };
}

class RoleStudioService {
    constructor({ vcpCoreClient, llmClient, sessionService, sourceService = null }) {
        this.vcpCoreClient = vcpCoreClient;
        this.llmClient = llmClient;
        this.sessionService = sessionService;
        this.sourceService = sourceService || new RoleStudioSourceService();
        const configuredModels = String(
            process.env.GROUPCHAT_ROLE_STUDIO_MODELS || process.env.GROUPCHAT_ROLE_STUDIO_MODEL || ''
        )
            .split(',')
            .map(item => item.trim())
            .filter(Boolean);
        this.models = configuredModels.length ? configuredModels : DEFAULT_FAST_MODELS;
        this.temperature = Number(process.env.GROUPCHAT_ROLE_STUDIO_TEMPERATURE || 0.35);
        this.maxTokens = Number(process.env.GROUPCHAT_ROLE_STUDIO_MAX_TOKENS || 1600);
    }

    getRuntimeConfig() {
        return {
            models: [...this.models],
            temperature: this.temperature,
            max_tokens: this.maxTokens,
            ...this.sourceService.getRuntimeConfig()
        };
    }

    buildDraftModelOrder(preferredModel = null) {
        const preferred = sanitizeText(preferredModel, 120);
        if (!preferred) {
            return [...this.models];
        }
        return [preferred, ...this.models.filter(model => model !== preferred)];
    }

    async requestDraftCompletion(messages, preferredModel = null) {
        const failures = [];
        const requestModels = this.buildDraftModelOrder(preferredModel);
        const requestedModel = sanitizeText(preferredModel, 120) || null;

        for (const model of requestModels) {
            try {
                const completion = await this.llmClient.chatCompletions({
                    model,
                    messages,
                    temperature: this.temperature,
                    max_tokens: this.maxTokens,
                    include_reasoning: false,
                    response_format: { type: 'json_object' }
                });

                const content = extractCompletionText(completion);
                if (!content) {
                    throw new Error('empty completion content');
                }

                const parsedDraft = extractJsonObject(content);
                return {
                    selectedModel: model,
                    model: completion?.model || model,
                    parsedDraft,
                    requestedModel
                };
            } catch (error) {
                failures.push(`${model}: ${error.message}`);
            }
        }

        throw new Error(`all role studio models failed: ${failures.join(' | ')}`);
    }

    async buildContext({ sessionId, profileId }) {
        const session = sessionId ? this.sessionService.getSession(sessionId) : null;
        const resolvedProfileId = profileId || session?.profile_id || DEFAULT_PROFILE.id;
        const profile = resolvedProfileId ? this.sessionService.getProfile(resolvedProfileId) : null;
        const warnings = [];
        let coreRoles = [];
        try {
            coreRoles = await this.vcpCoreClient.listRoles();
        } catch (error) {
            warnings.push(`core roles unavailable: ${summarizeInline(error.message, 160)}`);
        }
        const coreRoleMap = new Map(coreRoles.map(role => [role.id, role]));

        const profileMembers = (profile?.members || [])
            .filter(member => member.enabled)
            .map(member => {
                const coreRole = coreRoleMap.get(member.role_id);
                const roleSpec = coreRole?.role_spec || {};
                return {
                    id: member.role_id,
                    name: member.role_name || coreRole?.name || member.role_id,
                    description: summarizeInline(coreRole?.description || roleSpec.description || roleSpec.persona || '', 120),
                    responsibilities: normalizeStringArray(roleSpec.responsibilities, 4)
                };
            });

        const ephemeralRoles = (session?.ephemeral_roles || [])
            .filter(role => !role.promoted_core_role_id)
            .map(role => ({
                id: role.id,
                name: role.name,
                description: summarizeInline(role.description || role.role_spec?.description || role.role_spec?.persona || '', 120),
                responsibilities: normalizeStringArray(role.role_spec?.responsibilities, 4)
            }));

        return {
            session,
            profile,
            profileMembers,
            ephemeralRoles,
            warnings
        };
    }

    buildEngineSystemInstructions(generationContext) {
        const engine = generationContext?.engine || 'vcp_default';
        const common = [
            '生成目标始终是 VCP 群聊角色草稿 JSON，不要输出 PromptX 文件，不要真的创建仓库文件。',
            '角色只负责认知、专业判断和协作输出；团队、群组、会话、导入、保存都由系统业务层处理。',
            'template 字段要能直接作为角色系统提示词使用，必须包含角色定位、职责边界、工作流程、协作规则。'
        ];

        if (engine === 'promptx_nuwa') {
            return [
                ...common,
                '当前引擎：PromptX 女娲。',
                '请吸收 PromptX 女娲的角色创建方法论：从问题本质出发，按 thought / execution / knowledge 三层组织角色认知。',
                '如果用户需求不完整，不要返回问题列表；请用合理默认值补齐，并在 collaborationGuide 中写清后续可迭代方向。',
                'template 可借鉴 DPML 的分层思想，但必须输出普通多行提示词，不要输出多个文件路径。'
            ];
        }

        if (engine === 'agency_adapt') {
            return [
                ...common,
                '当前引擎：agency-agents 改写。',
                '请参考给定 agency-agents 专家模板的专业深度、交付物意识、规则结构和表达风格。',
                '不要照抄 agency 角色名称、个人履历或工具清单；要改写成适合 VCP 群聊系统的新角色。',
                '职责要比默认生成更专业、更可执行，并能和群组其他角色互补。'
            ];
        }

        if (engine === 'hybrid') {
            return [
                ...common,
                '当前引擎：PromptX + agency 混合。',
                '用 PromptX 女娲方法论负责角色结构：本质问题、三层认知、职责边界、精简原则。',
                '用 agency-agents 专家模板负责领域专业度：身份质感、交付物、工作流、质量标准。',
                '最终输出必须是一个 VCP 角色草稿，不要混入 PromptX 仓库操作或 agency 安装说明。'
            ];
        }

        return common;
    }

    buildGenerationReferenceSections(generationContext) {
        const sections = [];

        if (generationContext?.promptx?.methodology) {
            sections.push([
                '【PromptX 女娲角色创建方法论摘录】',
                generationContext.promptx.methodology,
                '【PromptX 摘录结束】'
            ].join('\n'));
        }

        if (generationContext?.agency?.reference_text) {
            sections.push([
                '【agency-agents 专家模板参考】',
                generationContext.agency.reference_text,
                '【agency-agents 参考结束】'
            ].join('\n'));
        }

        if (!sections.length) {
            return '';
        }

        return sections.join('\n\n');
    }

    buildMessages({ idea, context, generationContext }) {
        const profileSummary = context.profile
            ? `当前群聊配置：${context.profile.name}\n群组说明：${summarizeInline(context.profile.description || '无', 120)}\n群组协作提示：${summarizeInline(context.profile.group_prompt || DEFAULT_PROFILE.group_prompt, 320)}`
            : `当前未指定群聊配置，默认群组提示：${summarizeInline(DEFAULT_PROFILE.group_prompt, 320)}`;

        const currentRoles = [...context.profileMembers, ...context.ephemeralRoles]
            .map(role => {
                const responsibilityText = role.responsibilities.length
                    ? `；职责：${role.responsibilities.join('、')}`
                    : '';
                return `- ${role.name}：${role.description || '暂无描述'}${responsibilityText}`;
            })
            .join('\n') || '- 当前没有已知角色';
        const engineInstructions = this.buildEngineSystemInstructions(generationContext);
        const referenceSections = this.buildGenerationReferenceSections(generationContext);

        return [
            {
                role: 'system',
                content: [
                    '你是 VCP 群聊系统的角色设计器。',
                    '任务：把用户一句中文需求，设计成一个可以加入群聊协作系统的角色草稿。',
                    `当前工坊引擎：${generationContext?.engine || 'vcp_default'}。`,
                    '边界要求：',
                    '1. 角色是认知与协作单元，不是业务按钮。',
                    '2. 不要把“创建群组、主持会话、切换会话、管理前端界面、系统管理员”当成角色本体。',
                    '3. 角色要尽量补位，不要和现有角色职责高度重复。',
                    '4. 输出必须是合法 JSON 对象，不要输出 Markdown，不要输出解释。',
                    '5. JSON 必须包含这些字段：name, description, persona, responsibilities, template, privateNotebook, knowledgeNotebook, invitePrompt, collaborationGuide, voiceStyle, model。',
                    '6. responsibilities 必须是 3 到 6 条短句数组。',
                    '7. privateNotebook 和 knowledgeNotebook 必须是单个短名称，不能写成逗号分隔列表，不能填公共。',
                    '8. template 必须是多行角色提示词正文，不能只写角色名、群组名或一句空话。',
                    '9. model 一般留空字符串，除非用户明确要求绑定特定模型。',
                    `10. 共享记忆本固定包含：${DEFAULT_SHARED_NOTEBOOK}。`,
                    '',
                    '引擎附加规则：',
                    ...engineInstructions
                ].join('\n')
            },
            {
                role: 'user',
                content: [
                    `用户一句话需求：${idea}`,
                    '',
                    profileSummary,
                    '',
                    '当前已存在的角色：',
                    currentRoles,
                    '',
                    referenceSections,
                    referenceSections ? '' : null,
                    '请设计一个职责边界清晰、适合群聊协作、能写入独有记忆的角色。'
                ].filter(item => item != null).join('\n')
            }
        ];
    }

    async draftRole({
        idea,
        sessionId = null,
        profileId = null,
        preferredModel = null,
        engine = 'vcp_default',
        referenceItemIds = [],
        agencyLimit = 3
    }) {
        const normalizedIdea = sanitizeText(idea, 300);
        if (!normalizedIdea) {
            throw new Error('idea is required');
        }

        const context = await this.buildContext({ sessionId, profileId });
        const generationContext = await this.sourceService.buildGenerationContext({
            engine,
            idea: normalizedIdea,
            referenceItemIds,
            agencyLimit
        });
        const messages = this.buildMessages({
            idea: normalizedIdea,
            context,
            generationContext
        });
        const completionResult = await this.requestDraftCompletion(messages, preferredModel);
        const parsedDraft = completionResult.parsedDraft;
        const draft = normalizeRoleDraft(parsedDraft, normalizedIdea);

        return {
            draft,
            meta: {
                source: 'llm',
                model: completionResult.model,
                selected_model: completionResult.selectedModel,
                requested_model: completionResult.requestedModel,
                profile_id: context.profile?.id || null,
                profile_name: context.profile?.name || null,
                session_id: context.session?.id || null,
                engine: generationContext.engine,
                promptx_files: (generationContext.promptx?.files || []).map(file => file.label),
                agency_references: (generationContext.agency?.references || []).map(reference => ({
                    id: reference.id,
                    name: reference.name,
                    division: reference.division
                })),
                warnings: [
                    ...(context.warnings || []),
                    ...(generationContext.warnings || [])
                ]
            }
        };
    }

    async listSources(options = {}) {
        return this.sourceService.listSources(options);
    }
}

module.exports = RoleStudioService;
