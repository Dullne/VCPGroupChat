const DEFAULT_GROUPCHAT_STREAM_MODELS = [
    'bytedance-seed/seed-1.6-flash',
    'qwen/qwen3.5-flash-02-23',
    'z-ai/glm-4.7-flash',
    'qwen/qwen3.6-plus-preview:free'
];
const DEFAULT_GROUPCHAT_MAX_OUTPUT_TOKENS = 320;
const DEFAULT_GROUPCHAT_REPLY_CHAR_LIMIT = 220;
const DEFAULT_MODEL_FAILURE_COOLDOWN_MS = 5 * 60 * 1000;

function extractCoreGatewayError(delta) {
    const text = String(delta || '').trim();
    if (!text) {
        return '';
    }
    if (text.startsWith('[UPSTREAM_ERROR]')) {
        return text;
    }
    if (text.startsWith('[ERROR] 代理服务器在连接上游API时失败')) {
        return text;
    }
    return '';
}

function uniqueNonEmpty(values = []) {
    return [...new Set(
        values
            .flatMap(value => Array.isArray(value) ? value : String(value || '').split(','))
            .map(value => String(value || '').trim())
            .filter(Boolean)
    )];
}

function normalizeModelId(value) {
    return String(value || '').trim().toLowerCase();
}

function readBoundedIntEnv(name, fallback, min, max) {
    const rawValue = Number(process.env[name]);
    if (!Number.isFinite(rawValue)) {
        return fallback;
    }
    return Math.max(min, Math.min(max, Math.floor(rawValue)));
}

function extractTextContent(content) {
    if (typeof content === 'string') {
        return content;
    }

    if (Array.isArray(content)) {
        return content
            .filter(item => item && item.type === 'text' && typeof item.text === 'string')
            .map(item => item.text)
            .join('\n');
    }

    if (content && typeof content === 'object') {
        return content.text || '';
    }

    return '';
}

function isRuntimeOnlyMemoryStatusText(value) {
    const text = String(value || '').replace(/\s+/g, '');
    if (!text || text.length > 220) {
        return false;
    }

    const mentionsPrivateUnavailable = /私有记忆(?:暂不可读|不可读|暂不可用|未注入|无法读取)/.test(text);
    const mentionsSharedStatus = /(?:当前|本轮)?(?:公共|共享|团队共享)?记忆(?:无可用内容|当前无可用|无可用|暂无可用|暂不可用|为空|含.*(?:规则|结论))/.test(text);
    const mentionsMemoryBoundary = /(?:区分|辨认|补全).*(?:私有|公共|共享).*记忆(?:边界)?/.test(text)
        || /记忆边界/.test(text);

    return mentionsPrivateUnavailable && (mentionsSharedStatus || mentionsMemoryBoundary);
}

function shouldOmitHistoryMessage(message) {
    if (message?.role !== 'assistant') {
        return false;
    }
    return isRuntimeOnlyMemoryStatusText(extractTextContent(message.content));
}

function toChatMessage(message) {
    const senderName = message.name || message.speaker_name || '';
    const textContent = extractTextContent(message.content);
    const imageUrl = message?.content?.image;
    const prefix = senderName ? `${senderName}: ` : '';

    if (imageUrl) {
        return {
            role: message.role,
            content: [
                { type: 'text', text: textContent ? `${prefix}${textContent}` : `${prefix}[图片]` },
                { type: 'image_url', image_url: { url: imageUrl } }
            ]
        };
    }

    return {
        role: message.role,
        content: `${prefix}${textContent}`.trim()
    };
}

function parseMentionedRoleIds(text, candidateRoles) {
    const content = String(text || '');
    const mentioned = new Set();

    const splitTags = value => String(value || '')
        .split(/[,\s，、;；|/]+/)
        .map(item => item.trim())
        .filter(Boolean);

    for (const role of candidateRoles) {
        const aliases = new Set();
        if (role.name) {
            aliases.add(role.name);
        }
        for (const tag of splitTags(role.tag || role.role_spec?.tag || '')) {
            aliases.add(tag);
        }

        for (const alias of aliases) {
            if (!alias) {
                continue;
            }
            if (content.includes(`@${alias}`)) {
                mentioned.add(role.id);
                break;
            }
        }
    }

    return mentioned;
}

function buildHistoryMessages(messages) {
    return messages.map(message => ({
        role: message.role,
        name: message.speaker_name,
        content: message.content
    }));
}

function normalizeRoleSpec(role = {}) {
    const roleSpec = role.role_spec && typeof role.role_spec === 'object'
        ? role.role_spec
        : {};

    return {
        id: role.id || roleSpec.id || '',
        name: role.name || roleSpec.name || '临时角色',
        source: role.source || roleSpec.source || 'groupchat',
        description: role.description || roleSpec.description || '',
        avatar: role.avatar || roleSpec.avatar || '',
        tag: role.tag || roleSpec.tag || '',
        model: role.model || roleSpec.model || '',
        max_tokens: role.max_tokens || roleSpec.max_tokens || role.maxTokens || roleSpec.maxTokens || 1000000,
        output_tokens: role.output_tokens || roleSpec.output_tokens || role.outputTokens || roleSpec.outputTokens || 2048,
        temperature: role.temperature ?? roleSpec.temperature ?? 0.7,
        context_token_limit: role.context_token_limit || roleSpec.context_token_limit || role.contextTokenLimit || roleSpec.contextTokenLimit || 1000000,
        invite_prompt: role.invite_prompt || roleSpec.invite_prompt || '',
        persona: role.persona || roleSpec.persona || '',
        responsibilities: Array.isArray(role.responsibilities)
            ? role.responsibilities
            : (Array.isArray(roleSpec.responsibilities) ? roleSpec.responsibilities : []),
        collaboration_guide: role.collaboration_guide || roleSpec.collaboration_guide || '',
        voice_style: role.voice_style || roleSpec.voice_style || '',
        memory: role.memory || roleSpec.memory || null,
        template_content: role.template_content || roleSpec.template_content || ''
    };
}

function buildMemoryInstruction(memory, memoryScope = {}, writePolicy = {}) {
    if (!memory) {
        return '';
    }

    const lines = ['记忆规则：'];

    if (memory.privateNotebook) {
        lines.push(`- 你的私有记忆本是：${memory.privateNotebook}。`);
    }
    if (memory.knowledgeNotebook) {
        lines.push(`- 你的知识记忆本是：${memory.knowledgeNotebook}。`);
    }
    if (Array.isArray(memory.sharedNotebooks) && memory.sharedNotebooks.length > 0) {
        lines.push(`- 可访问的共享记忆本：${memory.sharedNotebooks.join('、')}。`);
    }

    lines.push('- 不要读取或写入其他角色的私有记忆。');
    lines.push('- 若某个记忆本本轮没有注入内容，不要主动声明它为空、不可读或暂不可读；只在用户明确询问记忆状态时说明。');

    if (memory.privateWritebackMaid) {
        lines.push(`- 需要沉淀个人长期记忆时，写回署名使用：${memory.privateWritebackMaid}。`);
    }
    if (memory.sharedWritebackMaid) {
        lines.push(`- 形成团队稳定结论时，可写入共享记忆，署名使用：${memory.sharedWritebackMaid}。`);
    }

    if (memoryScope && typeof memoryScope === 'object') {
        const scopeLines = [];
        if (memoryScope.allow_private === false) {
            scopeLines.push('本轮禁止读取私有记忆');
        }
        if (memoryScope.allow_knowledge === false) {
            scopeLines.push('本轮禁止读取知识记忆');
        }
        if (Array.isArray(memoryScope.shared_notebooks) && memoryScope.shared_notebooks.length > 0) {
            scopeLines.push(`本轮允许的共享记忆：${memoryScope.shared_notebooks.join('、')}`);
        }
        if (scopeLines.length > 0) {
            lines.push(`- 额外访问范围：${scopeLines.join('；')}。`);
        }
    }

    if (writePolicy && typeof writePolicy === 'object') {
        const policyLines = [];
        if (writePolicy.allow_private_write === false) {
            policyLines.push('禁止写私有记忆');
        }
        if (writePolicy.allow_shared_write === false) {
            policyLines.push('禁止写共享记忆');
        }
        if (policyLines.length > 0) {
            lines.push(`- 本轮写回约束：${policyLines.join('；')}。`);
        }
    }

    return lines.join('\n');
}

function escapeRegExp(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildDiaryPlaceholder(notebook) {
    const normalized = String(notebook || '').trim();
    return normalized ? `{{${normalized}日记本}}` : '';
}

function getConfiguredSharedNotebooks(memory = {}) {
    const configuredMemory = memory && typeof memory === 'object' ? memory : {};
    return Array.isArray(configuredMemory.sharedNotebooks)
        ? configuredMemory.sharedNotebooks.map(notebook => String(notebook || '').trim()).filter(Boolean)
        : [];
}

function collectConfiguredMemoryNotebooks(memory = {}) {
    const configuredMemory = memory && typeof memory === 'object' ? memory : {};
    const entries = [];
    if (configuredMemory.privateNotebook) {
        entries.push({ label: '私有记忆内容', notebook: configuredMemory.privateNotebook });
    }
    if (configuredMemory.knowledgeNotebook) {
        entries.push({ label: '知识记忆内容', notebook: configuredMemory.knowledgeNotebook });
    }
    for (const notebook of getConfiguredSharedNotebooks(configuredMemory)) {
        entries.push({ label: `共享记忆内容（${notebook}）`, notebook });
    }

    const seen = new Set();
    return entries.filter(entry => {
        const notebook = String(entry.notebook || '').trim();
        if (!notebook || seen.has(notebook)) {
            return false;
        }
        seen.add(notebook);
        entry.notebook = notebook;
        return true;
    });
}

function hasNotebookPlaceholder(text, notebook) {
    const normalized = String(notebook || '').trim();
    if (!normalized) {
        return false;
    }
    const escapedNotebook = escapeRegExp(normalized);
    const placeholderPattern = new RegExp(`(?:\\{\\{|\\[\\[|<<|《《)\\s*${escapedNotebook}\\s*日记本`);
    return placeholderPattern.test(String(text || ''));
}

function buildConfiguredMemoryContentSection(memory, existingPromptText) {
    if (!memory || typeof memory !== 'object') {
        return '';
    }

    const lines = [];
    for (const entry of collectConfiguredMemoryNotebooks(memory)) {
        if (hasNotebookPlaceholder(existingPromptText, entry.notebook)) {
            continue;
        }
        const placeholder = buildDiaryPlaceholder(entry.notebook);
        if (placeholder) {
            lines.push(`- ${entry.label}：${placeholder}`);
        }
    }

    if (lines.length === 0) {
        return '';
    }

    return [
        '角色记忆内容：',
        '- 以下内容由本轮允许访问的记忆本注入，用于回答当前问题。',
        '- 若某个记忆本本轮没有内容，不要主动声明它为空、不可读或暂不可读。',
        ...lines
    ].join('\n');
}

function buildGroupChatReplyContract() {
    const charLimit = readBoundedIntEnv(
        'GROUPCHAT_ROLE_REPLY_CHAR_LIMIT',
        DEFAULT_GROUPCHAT_REPLY_CHAR_LIMIT,
        60,
        600
    );

    return [
        '群聊输出约束：',
        '- 只输出 1 到 3 句短回复，优先一句话说清楚。',
        '- 只补充新增信息；如果没有新增价值，直接明确说暂时没有补充。',
        '- 不要重复上下文，不要写标题、编号、大纲、总结套话或“作为某某我认为”。',
        `- 总长度尽量控制在 ${charLimit} 个中文字符以内。`
    ].join('\n');
}

function buildRoleSystemPrompt({ roleSpec, profile, phase, userPrompt }) {
    const sections = [];

    if (userPrompt) {
        sections.push(userPrompt);
    }
    if (profile?.group_prompt) {
        sections.push(profile.group_prompt);
    }
    if (roleSpec.template_content) {
        sections.push(roleSpec.template_content.trim());
    }
    if (roleSpec.persona) {
        sections.push(`角色定位：${roleSpec.persona}`);
    }
    if (Array.isArray(roleSpec.responsibilities) && roleSpec.responsibilities.length > 0) {
        sections.push(`职责范围：\n- ${roleSpec.responsibilities.join('\n- ')}`);
    }
    if (roleSpec.collaboration_guide) {
        sections.push(`协作规则：${roleSpec.collaboration_guide}`);
    }
    if (roleSpec.voice_style) {
        sections.push(`表达风格：${roleSpec.voice_style}`);
    }
    if (phase) {
        sections.push(`当前阶段：${phase}`);
    }

    const memorySection = buildMemoryInstruction(
        roleSpec.memory,
        {
            allow_private: true,
            allow_knowledge: true,
            shared_notebooks: getConfiguredSharedNotebooks(roleSpec.memory)
        },
        {
            allow_private_write: true,
            allow_shared_write: true
        }
    );
    if (memorySection) {
        sections.push(memorySection);
    }
    const configuredMemoryContentSection = buildConfiguredMemoryContentSection(
        roleSpec.memory,
        sections.join('\n\n')
    );
    if (configuredMemoryContentSection) {
        sections.push(configuredMemoryContentSection);
    }

    sections.push([
        '运行模式：group_chat',
        `当前群组模板：${profile?.name || ''}`
    ].join('\n'));
    sections.push(buildGroupChatReplyContract());

    return sections.filter(Boolean).join('\n\n');
}

function buildInvitePrompt(roleSpec, phase) {
    const phaseText = phase ? `当前阶段是 ${phase}。` : '';
    const basePrompt = roleSpec.invite_prompt
        ? roleSpec.invite_prompt
        : `接下来请作为${roleSpec.name}发言。${phaseText}优先回答自己职责范围内的问题，保持简洁、口语化，不要输出额外聊天标识头。`;

    return [
        basePrompt,
        '本轮只给 1 到 3 句短回复，不复述前文，不加标题。'
    ].filter(Boolean).join('\n');
}

function buildMemoryTrace(roleSpec = {}, payload = {}) {
    const memory = roleSpec.memory && typeof roleSpec.memory === 'object'
        ? roleSpec.memory
        : {};
    const sharedNotebooks = Array.isArray(memory.sharedNotebooks) ? memory.sharedNotebooks : [];

    return {
        role_id: roleSpec.id || '',
        role_name: roleSpec.name || '',
        private_notebook: memory.privateNotebook || memory.private_notebook || '',
        knowledge_notebook: memory.knowledgeNotebook || memory.knowledge_notebook || '',
        shared_notebooks: sharedNotebooks.filter(Boolean),
        read_policy: {
            allow_private: true,
            allow_knowledge: true,
            allow_shared: sharedNotebooks.length > 0
        },
        write_policy: {
            allow_private_write: true,
            allow_shared_write: true
        },
        writeback: {
            private_maid: memory.privateWritebackMaid || memory.private_writeback_maid || '',
            shared_maid: memory.sharedWritebackMaid || memory.shared_writeback_maid || ''
        },
        execution_context: payload.execution_context || {},
        trace_source: 'groupchat-product-stream',
        storage_owner: 'VCPToolBox'
    };
}

function resolveMaxOutputTokens(roleSpec = {}) {
    const configuredTokens = Number(roleSpec.output_tokens || 2048);
    const normalizedConfiguredTokens = Number.isFinite(configuredTokens)
        ? Math.max(64, Math.min(8192, Math.floor(configuredTokens)))
        : 2048;
    const groupChatTokenLimit = readBoundedIntEnv(
        'GROUPCHAT_ROLE_MAX_OUTPUT_TOKENS',
        DEFAULT_GROUPCHAT_MAX_OUTPUT_TOKENS,
        64,
        1024
    );

    return Math.min(normalizedConfiguredTokens, groupChatTokenLimit);
}

class Orchestrator {
    constructor({ sessionService, vcpCoreClient, llmClient, userName, userPrompt }) {
        this.sessionService = sessionService;
        this.vcpCoreClient = vcpCoreClient;
        this.llmClient = llmClient;
        this.userName = userName;
        this.userPrompt = userPrompt;
        this.modelFailureCache = new Map();
    }

    async loadCandidates(session) {
        const [coreRoles, ephemeralRoles] = await Promise.all([
            this.vcpCoreClient.listRoles(),
            Promise.resolve(session.ephemeral_roles || [])
        ]);

        const profile = this.sessionService.getProfile(session.profile_id);
        if (!profile) {
            throw new Error(`group profile not found: ${session.profile_id}`);
        }

        const coreRoleMap = new Map(coreRoles.map(role => [role.id, role]));
        const candidates = [];

        for (const member of profile.members.filter(item => item.enabled)) {
            const role = coreRoleMap.get(member.role_id);
            if (role) {
                candidates.push({
                    ...role,
                    role_order: member.role_order,
                    kind: 'core'
                });
            }
        }

        for (const ephemeral of ephemeralRoles) {
            if (ephemeral.promoted_core_role_id) {
                continue;
            }
            candidates.push({
                id: ephemeral.id,
                name: ephemeral.name,
                avatar: ephemeral.avatar,
                description: ephemeral.description,
                role_spec: ephemeral.role_spec,
                role_order: 1000,
                kind: 'ephemeral'
            });
        }

        return {
            profile,
            candidates
        };
    }

    resolveTargetRoles(candidates, userText, includeRoleIds = [], excludeRoleIds = [], options = {}) {
        const excluded = new Set(excludeRoleIds || []);
        const included = new Set(includeRoleIds || []);
        const mentioned = parseMentionedRoleIds(userText, candidates);
        const applyMentionFallback = options.applyMentionFallback !== false;

        let selected = candidates
            .filter(role => !excluded.has(role.id))
            .sort((a, b) => (a.role_order || 0) - (b.role_order || 0));

        if (included.size > 0) {
            selected = selected.filter(role => included.has(role.id));
        } else if (applyMentionFallback && mentioned.size > 0) {
            selected = selected.filter(role => mentioned.has(role.id));
        }

        return selected;
    }

    pickRandomSubset(items, targetCount) {
        const pool = [...items];
        for (let i = pool.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        return pool.slice(0, Math.max(0, targetCount));
    }

    getRandomInt(min, max) {
        if (max <= min) {
            return min;
        }
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    normalizeNatureRandomOptions(profile) {
        const source = profile?.mode_options && typeof profile.mode_options === 'object'
            ? profile.mode_options
            : {};

        const mentionMode = ['priority', 'additive', 'ignore'].includes(String(source.mention_mode || '').trim())
            ? String(source.mention_mode).trim()
            : 'priority';
        const minRaw = Number(source.random_min_speakers);
        const maxRaw = Number(source.random_max_speakers);
        const min = Number.isFinite(minRaw) ? Math.max(1, Math.min(6, Math.floor(minRaw))) : 2;
        const max = Number.isFinite(maxRaw) ? Math.max(1, Math.min(8, Math.floor(maxRaw))) : 3;

        return {
            mention_mode: mentionMode,
            random_min_speakers: Math.min(min, max),
            random_max_speakers: Math.max(min, max)
        };
    }

    normalizeSequentialOptions(profile) {
        const source = profile?.mode_options && typeof profile.mode_options === 'object'
            ? profile.mode_options
            : {};
        const profileLimitRaw = Number(
            source.max_speakers_per_round ?? source.sequential_max_speakers
        );
        const envLimitRaw = Number(process.env.GROUPCHAT_SEQUENTIAL_MAX_SPEAKERS);
        const fallbackLimit = Number.isFinite(envLimitRaw) ? envLimitRaw : 2;
        const limit = Number.isFinite(profileLimitRaw) ? profileLimitRaw : fallbackLimit;

        return {
            max_speakers_per_round: Math.max(1, Math.min(4, Math.floor(limit)))
        };
    }

    sortRolesByOrder(roles = []) {
        return [...roles].sort((a, b) => (a.role_order || 0) - (b.role_order || 0));
    }

    pickSequentialWindow(items, targetCount, roundIndex = 1) {
        const pool = Array.isArray(items) ? [...items] : [];
        const normalizedTargetCount = Math.max(
            1,
            Math.min(pool.length || 1, Math.floor(Number(targetCount) || 1))
        );

        if (pool.length <= normalizedTargetCount) {
            return pool;
        }

        const normalizedRoundIndex = Math.max(1, Math.floor(Number(roundIndex) || 1));
        const startIndex = ((normalizedRoundIndex - 1) * normalizedTargetCount) % pool.length;
        const selected = [];

        for (let index = 0; index < normalizedTargetCount; index += 1) {
            selected.push(pool[(startIndex + index) % pool.length]);
        }

        return selected;
    }

    markRoleReason(reasonMap, roleId, reason) {
        if (!roleId || !reason) {
            return;
        }
        const reasons = reasonMap.get(roleId) || new Set();
        reasons.add(reason);
        reasonMap.set(roleId, reasons);
    }

    normalizeExecutionError(error) {
        const message = String(error?.message || error?.toString?.() || 'unknown error').trim() || 'unknown error';
        if (message.length <= 180) {
            return message;
        }
        return `${message.slice(0, 177)}...`;
    }

    buildModelOrder(roleSpec) {
        const disabledModels = new Set(uniqueNonEmpty([
            process.env.GROUPCHAT_DISABLED_MODELS
        ]).map(normalizeModelId));

        return uniqueNonEmpty([
            roleSpec.model,
            process.env.GROUPCHAT_ROLE_MODEL,
            process.env.GROUPCHAT_ROLE_FALLBACK_MODELS,
            DEFAULT_GROUPCHAT_STREAM_MODELS
        ]).filter(model => !disabledModels.has(normalizeModelId(model)));
    }

    getModelFailureCooldownMs() {
        return readBoundedIntEnv(
            'GROUPCHAT_MODEL_FAILURE_COOLDOWN_SECONDS',
            DEFAULT_MODEL_FAILURE_COOLDOWN_MS / 1000,
            0,
            3600
        ) * 1000;
    }

    getCachedModelFailure(model) {
        const normalizedModel = normalizeModelId(model);
        if (!normalizedModel) {
            return null;
        }

        const cachedFailure = this.modelFailureCache.get(normalizedModel);
        if (!cachedFailure) {
            return null;
        }

        const cooldownMs = this.getModelFailureCooldownMs();
        if (cooldownMs <= 0) {
            return null;
        }

        if (Date.now() - cachedFailure.failedAt <= cooldownMs) {
            return cachedFailure;
        }

        this.modelFailureCache.delete(normalizedModel);
        return null;
    }

    rememberModelFailure(model, errorMessage) {
        const normalizedModel = normalizeModelId(model);
        if (!normalizedModel) {
            return;
        }

        this.modelFailureCache.set(normalizedModel, {
            model,
            error: errorMessage,
            failedAt: Date.now()
        });
    }

    buildStreamChatMessages({ roleSpec, profile, phase, fullHistory }) {
        const messages = [];
        const systemPrompt = buildRoleSystemPrompt({
            roleSpec,
            profile,
            phase,
            userPrompt: this.userPrompt
        });

        if (systemPrompt.trim()) {
            messages.push({ role: 'system', content: systemPrompt });
        }

        for (const message of fullHistory || []) {
            if (!message || !message.role) {
                continue;
            }
            if (shouldOmitHistoryMessage(message)) {
                continue;
            }
            messages.push(toChatMessage(message));
        }

        messages.push({
            role: 'user',
            content: buildInvitePrompt(roleSpec, phase)
        });

        return messages;
    }

    buildStreamSelectionRuntime({ sessionId, profile, role }) {
        return {
            mode: 'group_chat',
            group_profile_id: profile.id,
            group_profile_name: profile.name,
            group_profile_mode: profile.mode || 'sequential',
            group_profile_mode_options: profile.mode_options || {},
            group_profile_invite_prompt: profile.invite_prompt || '',
            invited_role_name: role.name,
            is_ephemeral: role.kind === 'ephemeral'
        };
    }

    async executeRoleStream({ sessionId, role, profile, phase, roundIndex, fullHistory, emit }) {
        const roleSpec = normalizeRoleSpec(role);
        const roleMeta = {
            id: role.id,
            name: role.name,
            kind: role.kind
        };
        const messages = this.buildStreamChatMessages({
            roleSpec,
            profile,
            phase,
            fullHistory
        });
        const modelOrder = this.buildModelOrder(roleSpec);
        const maxTokens = resolveMaxOutputTokens(roleSpec);
        const failures = [];
        let assistantText = '';
        let selectedModel = '';

        for (const model of modelOrder) {
            let emittedForModel = false;
            const textBeforeModel = assistantText;

            try {
                const cachedFailure = this.getCachedModelFailure(model);
                if (cachedFailure) {
                    failures.push(`${model}: skipped recent failure: ${cachedFailure.error}`);
                    continue;
                }

                selectedModel = model;
                for await (const chunk of this.llmClient.chatCompletionsStream({
                    model,
                    messages,
                    max_tokens: maxTokens,
                    temperature: roleSpec.temperature ?? 0.7,
                    contextTokenLimit: roleSpec.context_token_limit || 1000000
                })) {
                    if (chunk.done) {
                        break;
                    }
                    const delta = String(chunk.delta || '');
                    if (!delta) {
                        continue;
                    }
                    const gatewayError = extractCoreGatewayError(delta);
                    if (gatewayError) {
                        throw new Error(gatewayError);
                    }
                    emittedForModel = true;
                    assistantText += delta;
                    await emit('role_delta', {
                        role: roleMeta,
                        role_id: role.id,
                        role_name: role.name,
                        delta
                    });
                }

                const savedMessage = this.sessionService.addMessage(sessionId, {
                    role: 'assistant',
                    speaker_id: role.id,
                    speaker_name: role.name,
                    content: { text: assistantText },
                    round_index: roundIndex
                });

                return {
                    savedMessage,
                    selectedModel,
                    memoryTrace: buildMemoryTrace(roleSpec, {
                        execution_context: this.buildStreamSelectionRuntime({ sessionId, profile, role })
                    })
                };
            } catch (error) {
                const errorMessage = this.normalizeExecutionError(error);
                this.rememberModelFailure(model, errorMessage);
                failures.push(`${model}: ${errorMessage}`);
                if (emittedForModel || assistantText !== textBeforeModel) {
                    throw new Error(errorMessage);
                }
            }
        }

        throw new Error(`role stream failed: ${failures.join(' | ') || 'no model endpoints available'}`);
    }

    resolveTargetRolesByMode(profile, candidates, userText, includeRoleIds = [], excludeRoleIds = [], options = {}) {
        const mode = String(profile?.mode || 'sequential').trim().toLowerCase();
        const normalizedIncludeRoleIds = Array.isArray(includeRoleIds) ? includeRoleIds : [];
        const normalizedExcludeRoleIds = Array.isArray(excludeRoleIds) ? excludeRoleIds : [];
        const includeSet = new Set(normalizedIncludeRoleIds);
        const excludeSet = new Set(normalizedExcludeRoleIds);
        const sortedCandidates = this.sortRolesByOrder(candidates);
        const mentionedInCandidates = parseMentionedRoleIds(userText, sortedCandidates);
        const roundIndex = Math.max(1, Math.floor(Number(options?.roundIndex) || 1));

        const baseTargets = this.resolveTargetRoles(
            candidates,
            userText,
            normalizedIncludeRoleIds,
            normalizedExcludeRoleIds,
            { applyMentionFallback: mode === 'sequential' }
        );
        const hasInclude = normalizedIncludeRoleIds.length > 0;
        const reasonMap = new Map();
        const modeOptions = mode === 'naturerandom'
            ? this.normalizeNatureRandomOptions(profile)
            : (mode === 'sequential' ? this.normalizeSequentialOptions(profile) : {});
        let randomTargetCount = null;
        let targetRoles = baseTargets;

        if (hasInclude) {
            targetRoles = baseTargets;
            for (const role of targetRoles) {
                this.markRoleReason(reasonMap, role.id, '手动点名');
            }
        } else if (mode === 'invite_only') {
            const mentioned = parseMentionedRoleIds(userText, baseTargets);
            targetRoles = baseTargets.filter(role => mentioned.has(role.id));
            for (const role of targetRoles) {
                this.markRoleReason(reasonMap, role.id, '@点名');
            }
        } else if (mode === 'naturerandom') {
            const mentioned = parseMentionedRoleIds(userText, baseTargets);
            const mentionMode = modeOptions.mention_mode;

            if (mentionMode === 'priority' && mentioned.size > 0) {
                targetRoles = baseTargets.filter(role => mentioned.has(role.id));
                for (const role of targetRoles) {
                    this.markRoleReason(reasonMap, role.id, '@点名');
                }
            } else {
                const size = baseTargets.length;
                if (size <= 1) {
                    targetRoles = baseTargets;
                    for (const role of targetRoles) {
                        if (mentionMode !== 'ignore' && mentioned.has(role.id)) {
                            this.markRoleReason(reasonMap, role.id, '@点名');
                        } else {
                            this.markRoleReason(reasonMap, role.id, '随机抽样');
                        }
                    }
                } else {
                    const desiredCount = this.getRandomInt(
                        modeOptions.random_min_speakers,
                        modeOptions.random_max_speakers
                    );
                    const targetCount = Math.max(1, Math.min(size, desiredCount));
                    randomTargetCount = targetCount;

                    if (mentionMode === 'additive' && mentioned.size > 0) {
                        const mentionedRoles = baseTargets.filter(role => mentioned.has(role.id));
                        if (mentionedRoles.length >= targetCount) {
                            targetRoles = this.sortRolesByOrder(mentionedRoles.slice(0, targetCount));
                            for (const role of targetRoles) {
                                this.markRoleReason(reasonMap, role.id, '@点名');
                            }
                        } else {
                            const nonMentioned = baseTargets.filter(role => !mentioned.has(role.id));
                            const extra = this.pickRandomSubset(nonMentioned, targetCount - mentionedRoles.length);
                            targetRoles = this.sortRolesByOrder([...mentionedRoles, ...extra]);
                            for (const role of mentionedRoles) {
                                this.markRoleReason(reasonMap, role.id, '@点名');
                            }
                            for (const role of extra) {
                                this.markRoleReason(reasonMap, role.id, '随机补位');
                            }
                        }
                    } else {
                        targetRoles = this.sortRolesByOrder(this.pickRandomSubset(baseTargets, targetCount));
                        for (const role of targetRoles) {
                            this.markRoleReason(reasonMap, role.id, '随机抽样');
                        }
                    }
                }
            }
        } else {
            targetRoles = baseTargets;
            if (mentionedInCandidates.size > 0) {
                for (const role of targetRoles) {
                    this.markRoleReason(reasonMap, role.id, '@点名');
                }
            } else {
                const sequentialLimit = Math.max(
                    1,
                    Math.min(baseTargets.length || 1, Number(modeOptions.max_speakers_per_round || 2))
                );
                targetRoles = this.pickSequentialWindow(baseTargets, sequentialLimit, roundIndex);
                for (const role of targetRoles) {
                    this.markRoleReason(reasonMap, role.id, '顺序轮转');
                    this.markRoleReason(reasonMap, role.id, `每轮最多 ${sequentialLimit} 位`);
                }
            }
        }

        const targetRoleIds = new Set(targetRoles.map(role => role.id));
        const mentionedInTargets = parseMentionedRoleIds(userText, targetRoles);
        const rows = sortedCandidates.map(role => {
            const response = {
                id: role.id,
                name: role.name,
                kind: role.kind,
                role_order: role.role_order || 0,
                status: 'blocked',
                reasons: []
            };

            if (excludeSet.has(role.id)) {
                response.status = 'excluded';
                response.reasons.push('已排除');
                if (includeSet.has(role.id)) {
                    response.reasons.push('手动点名');
                }
                return response;
            }

            if (targetRoleIds.has(role.id)) {
                response.status = 'selected';
                response.reasons = [...(reasonMap.get(role.id) || [])];
                if (response.reasons.length === 0) {
                    response.reasons.push('已选中');
                }
                return response;
            }

            if (hasInclude) {
                response.reasons.push('未被手动点名');
                return response;
            }

            if (mode === 'invite_only') {
                response.reasons.push('未被@点名');
                return response;
            }

            if (mode === 'naturerandom') {
                if (modeOptions.mention_mode === 'priority' && mentionedInTargets.size > 0) {
                    response.reasons.push('点名优先未命中');
                } else if (modeOptions.mention_mode === 'additive' && mentionedInTargets.size > 0 && mentionedInCandidates.has(role.id)) {
                    response.reasons.push('点名超出随机上限');
                } else {
                    response.reasons.push('随机未命中');
                }
                return response;
            }

            if (mentionedInCandidates.size > 0) {
                response.reasons.push('未被@点名');
            } else {
                response.reasons.push(mode === 'sequential' ? '顺序轮转未到本轮' : '本轮未参与');
            }
            return response;
        });

        return {
            targetRoles,
            selectionTrace: {
                session_id: null,
                mode,
                mode_options: modeOptions,
                include_role_ids: normalizedIncludeRoleIds,
                exclude_role_ids: normalizedExcludeRoleIds,
                mentioned_role_ids: [...mentionedInCandidates],
                random_target_count: randomTargetCount,
                target_role_ids: [...targetRoleIds],
                rows
            }
        };
    }

    async runRound({ sessionId, userMessage, includeRoleIds = [], excludeRoleIds = [], phase = 'discuss', roundIndex = 1 }) {
        return this.runRoundStream({
            sessionId,
            userMessage,
            includeRoleIds,
            excludeRoleIds,
            phase,
            roundIndex,
            emit: async () => {}
        });
    }

    async runRoundStream({ sessionId, userMessage, includeRoleIds = [], excludeRoleIds = [], phase = 'discuss', roundIndex = 1, emit }) {
        const session = this.sessionService.getSession(sessionId);
        if (!session) {
            throw new Error(`session not found: ${sessionId}`);
        }

        const { profile, candidates } = await this.loadCandidates(session);
        const { targetRoles, selectionTrace } = this.resolveTargetRolesByMode(
            profile,
            candidates,
            userMessage.content?.text || '',
            includeRoleIds,
            excludeRoleIds,
            { roundIndex }
        );

        const fullHistory = buildHistoryMessages(session.messages);
        const assistantMessages = [];
        const failedRoles = [];
        const memoryTraces = [];
        const selectionRows = Array.isArray(selectionTrace?.rows) ? selectionTrace.rows : [];
        const selectionRowById = new Map(selectionRows.map(row => [row.id, row]));
        const succeededRoleIds = new Set();
        const failedRoleIds = new Set();

        await emit('round_started', {
            session_id: sessionId,
            round_index: roundIndex,
            target_roles: targetRoles.map(role => ({
                id: role.id,
                name: role.name,
                kind: role.kind
            })),
            selection_trace: {
                ...(selectionTrace || {}),
                session_id: sessionId,
                round_index: roundIndex,
                target_role_names: targetRoles.map(role => role.name),
                success_role_ids: [],
                failed_role_ids: [],
                memory_traces: []
            }
        });

        for (const role of targetRoles) {
            const roleMeta = {
                id: role.id,
                name: role.name,
                kind: role.kind
            };
            await emit('role_started', {
                role: roleMeta,
                round_index: roundIndex
            });

            try {
                const result = await this.executeRoleStream({
                    sessionId,
                    role,
                    profile,
                    phase,
                    roundIndex,
                    fullHistory,
                    emit
                });

                if (result.memoryTrace && typeof result.memoryTrace === 'object') {
                    memoryTraces.push({
                        ...result.memoryTrace,
                        role_id: result.memoryTrace.role_id || role.id,
                        role_name: result.memoryTrace.role_name || role.name,
                        selected_model: result.selectedModel || ''
                    });
                }

                fullHistory.push({
                    role: 'assistant',
                    name: role.name,
                    content: result.savedMessage.content
                });

                assistantMessages.push(result.savedMessage);
                succeededRoleIds.add(role.id);

                const row = selectionRowById.get(role.id);
                if (row) {
                    row.execution = 'ok';
                }

                await emit('role_completed', {
                    role: roleMeta,
                    message: result.savedMessage,
                    selected_model: result.selectedModel || ''
                });
            } catch (error) {
                const errorMessage = this.normalizeExecutionError(error);
                const failedRole = {
                    id: role.id,
                    name: role.name,
                    kind: role.kind,
                    error: errorMessage
                };
                failedRoles.push(failedRole);
                failedRoleIds.add(role.id);

                const row = selectionRowById.get(role.id);
                if (row) {
                    if (!Array.isArray(row.reasons)) {
                        row.reasons = [];
                    }
                    if (!row.reasons.includes('执行失败')) {
                        row.reasons.push('执行失败');
                    }
                    row.execution = 'failed';
                    row.execution_error = errorMessage;
                }

                await emit('role_failed', {
                    role: failedRole,
                    error: errorMessage
                });
            }
        }

        return {
            profile,
            target_roles: targetRoles.map(role => ({
                id: role.id,
                name: role.name,
                kind: role.kind
            })),
            assistant_messages: assistantMessages,
            failed_roles: failedRoles,
            selection_trace: {
                ...(selectionTrace || {}),
                session_id: sessionId,
                round_index: roundIndex,
                target_role_names: targetRoles.map(role => role.name),
                success_role_ids: [...succeededRoleIds],
                failed_role_ids: [...failedRoleIds],
                memory_traces: memoryTraces
            }
        };
    }
}

module.exports = Orchestrator;
