const fs = require('fs');
const path = require('path');

const ENGINE_DEFINITIONS = [
    {
        id: 'vcp_default',
        name: 'VCP 默认生成',
        description: '沿用当前工坊提示词，直接生成 VCP 群聊人物草稿。'
    },
    {
        id: 'promptx_nuwa',
        name: 'PromptX 女娲',
        description: '使用 PromptX 女娲的 DPML 人物设计方法论生成人物草稿。'
    },
    {
        id: 'agency_adapt',
        name: 'agency-agents 改写',
        description: '从 agency-agents 专家模板库选择参考样本，再改写成 VCP 人物。'
    },
    {
        id: 'hybrid',
        name: 'PromptX + agency 混合',
        description: '用 PromptX 女娲方法论设计结构，用 agency-agents 模板补足领域专业度。'
    }
];

const ENGINE_ALIASES = new Map([
    ['default', 'vcp_default'],
    ['basic', 'vcp_default'],
    ['llm', 'vcp_default'],
    ['vcp', 'vcp_default'],
    ['vcp_default', 'vcp_default'],
    ['promptx', 'promptx_nuwa'],
    ['nuwa', 'promptx_nuwa'],
    ['promptx_nuwa', 'promptx_nuwa'],
    ['agency', 'agency_adapt'],
    ['agency_agents', 'agency_adapt'],
    ['agency-agents', 'agency_adapt'],
    ['agency_adapt', 'agency_adapt'],
    ['hybrid', 'hybrid'],
    ['mixed', 'hybrid']
]);

const DEFAULT_AGENCY_LIMIT = 3;
const KEYWORD_HINTS = [
    {
        pattern: /产品|需求|路线图|用户|prd|product/i,
        ids: ['product/product-manager', 'product/product-feedback-synthesizer'],
        terms: ['product', 'manager', 'requirements', 'roadmap', 'prd', 'user']
    },
    {
        pattern: /代码|开发|技术|工程|架构|software|code|engineering|engineer|developer/i,
        ids: [
            'engineering/engineering-software-architect',
            'engineering/engineering-ai-engineer',
            'engineering/engineering-backend-architect',
            'engineering/engineering-frontend-developer'
        ],
        terms: ['engineering', 'engineer', 'developer', 'software', 'code', 'architecture', 'backend', 'frontend', 'api']
    },
    {
        pattern: /prompt|提示词|角色|agent|智能体/i,
        ids: ['engineering/engineering-prompt-engineer', 'engineering/engineering-ai-engineer'],
        terms: ['prompt', 'agent', 'ai', 'engineer']
    },
    {
        pattern: /前端|界面|ui|ux|react|vue|css/i,
        ids: ['engineering/engineering-frontend-developer', 'design/design-ui-designer'],
        terms: ['frontend', 'ui', 'ux', 'react', 'vue', 'css', 'designer']
    },
    {
        pattern: /后端|api|数据库|服务/i,
        ids: ['engineering/engineering-backend-architect', 'engineering/engineering-software-architect'],
        terms: ['backend', 'api', 'database', 'service', 'architect']
    },
    {
        pattern: /安全|漏洞|威胁|security/i,
        ids: ['security/security-architect', 'security/security-appsec-engineer'],
        terms: ['security', 'appsec', 'threat', 'architect']
    },
    {
        pattern: /测试|质量|qa|验收/i,
        ids: ['testing/testing-api-tester', 'testing/testing-reality-checker'],
        terms: ['testing', 'qa', 'quality', 'api']
    },
    {
        pattern: /营销|增长|运营|内容|私域/i,
        ids: ['marketing/marketing-growth-hacker', 'marketing/marketing-content-creator'],
        terms: ['marketing', 'growth', 'content', 'operations']
    },
    {
        pattern: /项目|推进|交付|协调|管理/i,
        ids: ['project-management/project-manager-senior', 'project-management/project-management-project-shepherd'],
        terms: ['project', 'management', 'delivery', 'coordination']
    }
];

function fileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (_error) {
        return false;
    }
}

function readTextFile(filePath, maxLength = 12000) {
    const content = fs.readFileSync(filePath, 'utf8');
    return sanitizeText(content, maxLength);
}

function sanitizeText(value, maxLength = 4000) {
    return String(value || '')
        .replace(/\r/g, '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .slice(0, maxLength);
}

function summarizeInline(value, maxLength = 240) {
    const normalized = String(value || '').replace(/\s+/g, ' ').trim();
    if (!normalized) {
        return '';
    }
    return normalized.length <= maxLength
        ? normalized
        : `${normalized.slice(0, maxLength - 1).trim()}...`;
}

function stripMarkdownNoise(value) {
    return sanitizeText(value, 12000)
        .replace(/```[\s\S]*?```/g, '')
        .replace(/!\[[^\]]*]\([^)]+\)/g, '')
        .replace(/\[[^\]]+]\([^)]+\)/g, match => match.replace(/\[|\]\([^)]+\)/g, ''))
        .replace(/[>*_`#|]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractFrontmatter(content) {
    const raw = String(content || '');
    const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
    if (!match) {
        return {
            data: {},
            body: raw
        };
    }

    const data = {};
    for (const line of match[1].split('\n')) {
        const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (!pair) {
            continue;
        }
        const key = pair[1].trim();
        let value = pair[2].trim();
        if (
            (value.startsWith('"') && value.endsWith('"'))
            || (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        data[key] = value;
    }

    return {
        data,
        body: raw.slice(match[0].length)
    };
}

function tokenize(value) {
    const raw = String(value || '').toLowerCase();
    const latin = raw.match(/[a-z0-9][a-z0-9-]{1,}/g) || [];
    const chinese = raw.match(/[\u4e00-\u9fff]{2,}/g) || [];
    const splitChinese = chinese.flatMap(item => {
        const grams = [];
        for (let i = 0; i < item.length - 1; i += 1) {
            grams.push(item.slice(i, i + 2));
        }
        return [item, ...grams];
    });
    return [...new Set([...latin, ...splitChinese])]
        .filter(token => token.length >= 2)
        .slice(0, 80);
}

function scoreText(tokens, text, weight = 1) {
    if (!tokens.length || !text) {
        return 0;
    }
    const haystack = String(text || '').toLowerCase();
    return tokens.reduce((score, token) => (
        haystack.includes(token) ? score + weight : score
    ), 0);
}

function collectKeywordHints(value) {
    const hintedIds = new Set();
    const expandedTerms = [];
    for (const hint of KEYWORD_HINTS) {
        if (hint.pattern.test(String(value || ''))) {
            for (const id of hint.ids) {
                hintedIds.add(id);
            }
            expandedTerms.push(...hint.terms);
        }
    }

    return {
        hintedIds,
        expandedTokens: [...new Set(expandedTerms.map(term => term.toLowerCase()).filter(Boolean))]
    };
}

function buildSearchTokens(value) {
    const tokens = tokenize(value);
    const hints = collectKeywordHints(value);
    return [...new Set([...tokens, ...hints.expandedTokens])]
        .filter(token => token.length >= 2)
        .slice(0, 120);
}

function normalizeSourceItemId(value) {
    return String(value || '')
        .trim()
        .replace(/^agency(?::|\/)/, '')
        .replace(/^agency-agents\//, '')
        .replace(/^agency_agents\//, '')
        .replace(/\.md$/i, '');
}

function slugifySourceId(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .replace(/_{2,}/g, '_')
        || 'source_item';
}

function buildImportedRuntimeIndex(runtimeRoles = []) {
    const importedIndex = new Map();
    for (const role of Array.isArray(runtimeRoles) ? runtimeRoles : []) {
        if (!role?.id) {
            continue;
        }

        importedIndex.set(`role:${role.id}`, role.id);
        const source = role.metadata?.external_source;
        const externalId = role.metadata?.external_id;
        if (source && externalId) {
            importedIndex.set(`${source}:${externalId}`, role.id);
        }
    }
    return importedIndex;
}

function walkMarkdownFiles(dirPath, maxDepth = 3, currentDepth = 0) {
    if (!fileExists(dirPath) || currentDepth > maxDepth) {
        return [];
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        if (entry.name.startsWith('.')) {
            continue;
        }
        const entryPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            files.push(...walkMarkdownFiles(entryPath, maxDepth, currentDepth + 1));
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
            files.push(entryPath);
        }
    }

    return files;
}

function resolveFirstExistingPath(candidates) {
    return candidates.find(candidate => candidate && fileExists(candidate)) || candidates[0];
}

class RoleStudioSourceService {
    constructor(options = {}) {
        const repoRoot = path.resolve(__dirname, '..', '..', '..');
        this.promptxResourceDir = resolveFirstExistingPath([
            options.promptxResourceDir,
            process.env.PROMPTX_RESOURCE_DIR,
            '/usr/src/external/PromptX/packages/resource',
            path.join(repoRoot, 'PromptX', 'packages', 'resource')
        ].filter(Boolean));
        this.agencyAgentsDir = resolveFirstExistingPath([
            options.agencyAgentsDir,
            process.env.AGENCY_AGENTS_DIR,
            '/usr/src/external/agency-agents',
            path.join(repoRoot, 'agency-agents')
        ].filter(Boolean));
        this.promptxCache = null;
        this.agencyCache = null;
    }

    normalizeEngine(engine) {
        const normalized = String(engine || 'vcp_default').trim().toLowerCase();
        return ENGINE_ALIASES.get(normalized) || 'vcp_default';
    }

    getEngineDefinitions() {
        const promptxAvailable = this.isPromptXAvailable();
        const agencyAvailable = this.isAgencyAvailable();
        return ENGINE_DEFINITIONS.map(engine => {
            let available = true;
            if (engine.id === 'promptx_nuwa') {
                available = promptxAvailable;
            } else if (engine.id === 'agency_adapt') {
                available = agencyAvailable;
            } else if (engine.id === 'hybrid') {
                available = promptxAvailable || agencyAvailable;
            }

            return {
                ...engine,
                available
            };
        });
    }

    getRuntimeConfig() {
        return {
            engines: this.getEngineDefinitions(),
            sources: {
                promptx: {
                    available: this.isPromptXAvailable(),
                    resource_dir: this.promptxResourceDir
                },
                agency_agents: {
                    available: this.isAgencyAvailable(),
                    dir: this.agencyAgentsDir
                }
            }
        };
    }

    isPromptXAvailable() {
        return fileExists(path.join(
            this.promptxResourceDir,
            'resources',
            'role',
            'nuwa',
            'nuwa.role.md'
        ));
    }

    isAgencyAvailable() {
        return fileExists(path.join(this.agencyAgentsDir, 'divisions.json'));
    }

    loadPromptXNuwaContext() {
        if (this.promptxCache) {
            return this.promptxCache;
        }

        if (!this.isPromptXAvailable()) {
            this.promptxCache = {
                available: false,
                files: [],
                methodology: '',
                warnings: [`PromptX resource dir not found: ${this.promptxResourceDir}`]
            };
            return this.promptxCache;
        }

        const nuwaDir = path.join(this.promptxResourceDir, 'resources', 'role', 'nuwa');
        const files = [
            ['nuwa.role.md', path.join(nuwaDir, 'nuwa.role.md'), 3600],
            ['execution/role-creation-workflow.execution.md', path.join(nuwaDir, 'execution', 'role-creation-workflow.execution.md'), 5200],
            ['thought/role-design-thinking.thought.md', path.join(nuwaDir, 'thought', 'role-design-thinking.thought.md'), 1800],
            ['thought/dpml-cognition.thought.md', path.join(nuwaDir, 'thought', 'dpml-cognition.thought.md'), 2200],
            ['thought/first-principles.thought.md', path.join(nuwaDir, 'thought', 'first-principles.thought.md'), 1600],
            ['thought/semantic-gap.thought.md', path.join(nuwaDir, 'thought', 'semantic-gap.thought.md'), 1600],
            ['thought/occams-razor.thought.md', path.join(nuwaDir, 'thought', 'occams-razor.thought.md'), 1500],
            ['knowledge/role-constraints.knowledge.md', path.join(nuwaDir, 'knowledge', 'role-constraints.knowledge.md'), 3200],
            ['knowledge/dpml-specification.knowledge.md', path.join(nuwaDir, 'knowledge', 'dpml-specification.knowledge.md'), 3200],
            ['knowledge/issue-framework.knowledge.md', path.join(nuwaDir, 'knowledge', 'issue-framework.knowledge.md'), 2800]
        ];

        const loadedFiles = [];
        const snippets = [];
        for (const [label, filePath, maxLength] of files) {
            if (!fileExists(filePath)) {
                continue;
            }
            const content = readTextFile(filePath, maxLength);
            loadedFiles.push({
                label,
                path: filePath
            });
            snippets.push(`### ${label}\n${content}`);
        }

        this.promptxCache = {
            available: loadedFiles.length > 0,
            files: loadedFiles,
            methodology: snippets.join('\n\n'),
            warnings: []
        };
        return this.promptxCache;
    }

    loadAgencyAgents() {
        if (this.agencyCache) {
            return this.agencyCache;
        }

        if (!this.isAgencyAvailable()) {
            this.agencyCache = {
                available: false,
                divisions: {},
                agents: [],
                warnings: [`agency-agents dir not found: ${this.agencyAgentsDir}`]
            };
            return this.agencyCache;
        }

        const divisionsPath = path.join(this.agencyAgentsDir, 'divisions.json');
        let divisions = {};
        try {
            const parsed = JSON.parse(readTextFile(divisionsPath, 12000));
            divisions = parsed?.divisions || {};
        } catch (error) {
            divisions = {};
        }

        const divisionIds = Object.keys(divisions);
        const agents = [];

        for (const divisionId of divisionIds) {
            const divisionDir = path.join(this.agencyAgentsDir, divisionId);
            for (const filePath of walkMarkdownFiles(divisionDir, 3)) {
                const relativePath = path.relative(this.agencyAgentsDir, filePath).replace(/\\/g, '/');
                const id = relativePath.replace(/\.md$/i, '');
                const content = readTextFile(filePath, 18000);
                const { data, body } = extractFrontmatter(content);
                const titleMatch = body.match(/^#\s+(.+)$/m);
                const name = sanitizeText(data.name || titleMatch?.[1] || path.basename(filePath, '.md'), 80);
                const description = sanitizeText(data.description || '', 420);
                const vibe = sanitizeText(data.vibe || '', 240);
                const excerpt = summarizeInline(stripMarkdownNoise(body), 900);

                agents.push({
                    id,
                    source_item_id: id,
                    source: 'agency_agents',
                    name,
                    description,
                    division: divisionId,
                    division_label: divisions[divisionId]?.label || divisionId,
                    color: data.color || divisions[divisionId]?.color || '',
                    emoji: data.emoji || '',
                    vibe,
                    tools: data.tools || '',
                    path: filePath,
                    excerpt
                });
            }
        }

        this.agencyCache = {
            available: true,
            divisions,
            agents,
            warnings: []
        };
        return this.agencyCache;
    }

    selectAgencyReferences({ idea, referenceItemIds = [], limit = DEFAULT_AGENCY_LIMIT }) {
        const catalog = this.loadAgencyAgents();
        if (!catalog.available) {
            return {
                available: false,
                references: [],
                warnings: catalog.warnings
            };
        }

        const normalizedIds = new Set(
            (Array.isArray(referenceItemIds) ? referenceItemIds : [referenceItemIds])
                .map(normalizeSourceItemId)
                .filter(Boolean)
        );

        if (normalizedIds.size > 0) {
            return {
                available: true,
                references: catalog.agents
                    .filter(agent => normalizedIds.has(agent.id))
                    .slice(0, Math.max(1, limit)),
                warnings: []
            };
        }

        const tokens = buildSearchTokens(idea);
        const { hintedIds } = collectKeywordHints(idea);

        const scored = catalog.agents.map(agent => {
            const text = [
                agent.id,
                agent.name,
                agent.description,
                agent.vibe,
                agent.division,
                agent.excerpt
            ].join('\n');
            const score = (
                scoreText(tokens, agent.name, 6)
                + scoreText(tokens, agent.description, 4)
                + scoreText(tokens, agent.vibe, 3)
                + scoreText(tokens, agent.excerpt, 1)
                + (hintedIds.has(agent.id) ? 24 : 0)
                + scoreText(tokens, text, 1)
            );

            return {
                agent,
                score
            };
        });

        const references = scored
            .sort((a, b) => b.score - a.score || a.agent.id.localeCompare(b.agent.id))
            .filter((item, index) => item.score > 0 || index < limit)
            .slice(0, Math.max(1, limit))
            .map(item => item.agent);

        return {
            available: true,
            references,
            warnings: []
        };
    }

    buildAgencyReferenceText(references) {
        if (!references.length) {
            return '';
        }

        return references.map((agent, index) => [
            `### agency 参考 ${index + 1}: ${agent.name}`,
            `- id: ${agent.id}`,
            `- division: ${agent.division_label}`,
            agent.description ? `- description: ${agent.description}` : null,
            agent.vibe ? `- vibe: ${agent.vibe}` : null,
            agent.tools ? `- tools: ${agent.tools}` : null,
            '',
            '摘录：',
            agent.excerpt
        ].filter(Boolean).join('\n')).join('\n\n');
    }

    getAgencySuggestedRuntimeRoleId(sourceItemId) {
        return `agency_${slugifySourceId(sourceItemId)}`;
    }

    getPromptXSuggestedRuntimeRoleId(sourceItemId) {
        return `promptx_${slugifySourceId(sourceItemId)}`;
    }

    getPromptXNuwaLegacyItem(promptxContext = this.loadPromptXNuwaContext()) {
        if (!promptxContext?.available) {
            return null;
        }

        return {
            id: 'nuwa',
            source_item_id: 'nuwa',
            source: 'promptx',
            name: 'PromptX 女娲',
            description: 'PromptX 女娲人物设计方法论，可作为创建长期人物的参考模板。',
            division: 'promptx',
            division_label: 'PromptX',
            color: '',
            emoji: '',
            vibe: 'PromptX role engineering',
            path: this.promptxResourceDir,
            excerpt: summarizeInline(promptxContext.methodology, 900),
            template_content: promptxContext.methodology
        };
    }

    toLegacyImportSourceItem(sourceId, sourceName, item, importedIndex = new Map()) {
        const sourceItemId = item.source_item_id || item.id;
        const suggestedRoleId = sourceId === 'promptx'
            ? this.getPromptXSuggestedRuntimeRoleId(sourceItemId)
            : this.getAgencySuggestedRuntimeRoleId(sourceItemId);
        const importedRoleId =
            importedIndex.get(`${sourceId}:${sourceItemId}`)
            || importedIndex.get(`role:${suggestedRoleId}`)
            || null;

        return {
            id: sourceItemId,
            source: sourceId,
            source_name: sourceName,
            source_item_id: sourceItemId,
            suggested_role_id: suggestedRoleId,
            name: item.name,
            description: item.description,
            preview: item.excerpt || item.vibe || item.description || '',
            tag: item.division || sourceId,
            voice_style: item.vibe || '',
            responsibilities: [],
            source_path: item.path || '',
            runtime_role_id: importedRoleId,
            has_runtime_role: Boolean(importedRoleId),
            metadata: {
                division: item.division || '',
                division_label: item.division_label || '',
                color: item.color || '',
                emoji: item.emoji || ''
            }
        };
    }

    listLegacyImportSources({ runtimeRoles = [] } = {}) {
        const importedIndex = buildImportedRuntimeIndex(runtimeRoles);
        const agency = this.loadAgencyAgents();
        const promptx = this.loadPromptXNuwaContext();
        const promptxLegacyItem = this.getPromptXNuwaLegacyItem(promptx);

        return [
            {
                id: 'agency_agents',
                name: 'agency-agents',
                description: '产品层读取的 agency-agents 人物参考模板，用于创建长期人物草稿。',
                available: agency.available,
                root_path: agency.available ? this.agencyAgentsDir : null,
                items: agency.available
                    ? agency.agents
                        .map(agent => this.toLegacyImportSourceItem(
                            'agency_agents',
                            'agency-agents',
                            agent,
                            importedIndex
                        ))
                        .sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id), 'zh-Hans-CN'))
                    : []
            },
            {
                id: 'promptx',
                name: 'PromptX',
                description: '产品层读取的 PromptX 女娲人物设计方法论，可作为长期人物草稿参考。',
                available: promptx.available,
                root_path: promptx.available ? this.promptxResourceDir : null,
                items: promptxLegacyItem
                    ? [this.toLegacyImportSourceItem('promptx', 'PromptX', promptxLegacyItem, importedIndex)]
                    : []
            }
        ];
    }

    async buildGenerationContext({
        engine,
        idea,
        referenceItemIds = [],
        agencyLimit = DEFAULT_AGENCY_LIMIT
    }) {
        const normalizedEngine = this.normalizeEngine(engine);
        const includePromptX = normalizedEngine === 'promptx_nuwa' || normalizedEngine === 'hybrid';
        const includeAgency = normalizedEngine === 'agency_adapt' || normalizedEngine === 'hybrid';
        const context = {
            engine: normalizedEngine,
            promptx: null,
            agency: {
                references: [],
                reference_text: ''
            },
            warnings: []
        };

        if (includePromptX) {
            const promptx = this.loadPromptXNuwaContext();
            context.promptx = promptx;
            context.warnings.push(...(promptx.warnings || []));
        }

        if (includeAgency) {
            const agency = this.selectAgencyReferences({
                idea,
                referenceItemIds,
                limit: agencyLimit
            });
            context.agency = {
                available: agency.available,
                references: agency.references,
                reference_text: this.buildAgencyReferenceText(agency.references)
            };
            context.warnings.push(...(agency.warnings || []));
        }

        return context;
    }

    async listSources({ query = '', limit = 30 } = {}) {
        const agency = this.loadAgencyAgents();
        const promptx = this.loadPromptXNuwaContext();
        const tokens = buildSearchTokens(query);
        const { hintedIds } = collectKeywordHints(query);
        const maxItems = Math.max(1, Math.min(100, Number(limit) || 30));

        const agencyItems = agency.available
            ? agency.agents
                .map(agent => ({
                    ...agent,
                    score: tokens.length
                        ? (
                            scoreText(tokens, agent.name, 6)
                            + scoreText(tokens, agent.description, 4)
                            + scoreText(tokens, agent.vibe, 3)
                            + scoreText(tokens, agent.excerpt, 1)
                            + (hintedIds.has(agent.id) ? 24 : 0)
                        )
                        : 1
                }))
                .filter(item => !tokens.length || item.score > 0)
                .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
                .slice(0, maxItems)
            : [];

        return {
            engines: this.getEngineDefinitions(),
            promptx: {
                available: promptx.available,
                files: promptx.files || [],
                warnings: promptx.warnings || []
            },
            agency_agents: {
                available: agency.available,
                total: agency.agents?.length || 0,
                divisions: agency.divisions || {},
                items: agencyItems,
                warnings: agency.warnings || []
            }
        };
    }
}

module.exports = RoleStudioSourceService;
