import { translateUiText } from '../core/i18n.js';

function getSelectedReferenceIds(deps) {
    const selectedIds = deps.getSelectedRoleStudioReferenceIds();
    return selectedIds instanceof Set ? selectedIds : new Set(selectedIds || []);
}

function resolveEngineDescription(engines, engineId) {
    return engines.find(engine => engine.id === engineId)?.description || '选择一种生成方式。';
}

function resolveEngineContract(engineId) {
    if (engineId === 'promptx_nuwa') {
        return '当前流水线：PromptX 女娲方法论 -> VCP 人物草稿。适合从零设计人物结构、职责边界和认知分层。';
    }
    if (engineId === 'agency_adapt') {
        return '当前流水线：agency-agents 专家模板 -> VCP 人物草稿。适合把现有专家模板改写成群聊人物。';
    }
    if (engineId === 'hybrid') {
        return '当前流水线：PromptX 女娲结构化人物设计 + agency-agents 专业模板参考 -> VCP 人物草稿。';
    }
    return '当前流水线：VCP 默认人物生成 -> VCP 人物草稿。不会直接创建 PromptX 文件或 agency 仓库角色。';
}

function resolveSelectedReferenceItems(agencyItems, selectedIds) {
    const itemMap = new Map(agencyItems.map(item => [String(item.source_item_id || item.id), item]));
    return [...selectedIds]
        .map(id => itemMap.get(String(id)))
        .filter(Boolean);
}

function renderSelectedReferences(dom, selectedItems, summarizeInline) {
    if (!dom.roleStudioSelectedReferences) {
        return;
    }

    dom.roleStudioSelectedReferences.innerHTML = '';
    if (!selectedItems.length) {
        dom.roleStudioSelectedReferences.innerHTML = '<div class="role-studio-selected-empty">未固定参考模板。生成时后端会按需求自动检索 agency-agents。</div>';
        return;
    }

    for (const item of selectedItems.slice(0, 6)) {
        const chip = document.createElement('div');
        chip.className = 'role-studio-selected-chip';
        const name = document.createElement('strong');
        name.textContent = item.name || item.id;
        const meta = document.createElement('span');
        meta.textContent = summarizeInline(item.division_label || item.division || item.source_item_id || item.id, 42);
        chip.appendChild(name);
        chip.appendChild(meta);
        dom.roleStudioSelectedReferences.appendChild(chip);
    }
}

function createReferenceCard(item, deps) {
    const {
        selectedIds,
        toggleRoleStudioReference,
        summarizeInline
    } = deps;

    const sourceItemId = item.source_item_id || item.id;
    const selected = selectedIds.has(sourceItemId);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `role-studio-reference-card${selected ? ' role-studio-reference-card-selected' : ''}`;
    card.dataset.sourceItemId = sourceItemId;
    card.setAttribute('aria-pressed', selected ? 'true' : 'false');

    const topline = document.createElement('span');
    topline.className = 'role-studio-reference-topline';
    const name = document.createElement('span');
    name.className = 'role-studio-reference-name';
    name.textContent = item.name || sourceItemId;
    const badge = document.createElement('span');
    badge.className = 'role-badge';
    badge.textContent = item.division_label || item.division || 'agency';
    topline.appendChild(name);
    topline.appendChild(badge);

    const description = document.createElement('span');
    description.className = 'role-studio-reference-desc';
    description.textContent = summarizeInline(item.description || item.vibe || item.excerpt || '', 160);

    card.appendChild(topline);
    card.appendChild(description);
    card.addEventListener('click', () => toggleRoleStudioReference(sourceItemId));
    return card;
}

export function createRoleStudioSourcesRenderer(deps) {
    const {
        getDom,
        getRoleStudioSources,
        getSelectedRoleStudioEngine,
        getSelectedRoleStudioReferenceIds,
        toggleRoleStudioReference,
        summarizeInline
    } = deps;

    function renderRoleStudioSources() {
        const dom = getDom();
        const sources = getRoleStudioSources();
        const engines = Array.isArray(sources?.engines) ? sources.engines : [];
        const selectedEngine = getSelectedRoleStudioEngine();
        const selectedIds = getSelectedReferenceIds({ getSelectedRoleStudioReferenceIds });
        const agencyItems = Array.isArray(sources?.agency_agents?.items) ? sources.agency_agents.items : [];

        dom.roleStudioEngineSelect.innerHTML = '';
        for (const engine of engines) {
            const option = document.createElement('option');
            option.value = engine.id;
            option.textContent = engine.available === false ? translateUiText(`${engine.name}（不可用）`) : engine.name;
            option.disabled = engine.available === false;
            dom.roleStudioEngineSelect.appendChild(option);
        }

        if (engines.length === 0) {
            const option = document.createElement('option');
            option.value = 'vcp_default';
            option.textContent = 'VCP 默认生成';
            dom.roleStudioEngineSelect.appendChild(option);
        }

        dom.roleStudioEngineSelect.value = selectedEngine || dom.roleStudioEngineSelect.options[0]?.value || 'vcp_default';
        dom.roleStudioEngineMeta.textContent = resolveEngineDescription(engines, dom.roleStudioEngineSelect.value);
        if (dom.roleStudioFactoryContract) {
            dom.roleStudioFactoryContract.textContent = resolveEngineContract(dom.roleStudioEngineSelect.value);
        }

        dom.roleStudioReferenceList.innerHTML = '';
        if (!sources) {
            dom.roleStudioReferenceList.innerHTML = '<div class="role-empty">正在加载 PromptX / agency-agents 参考源...</div>';
            dom.roleStudioReferenceMeta.textContent = '';
            renderSelectedReferences(dom, [], summarizeInline);
            return;
        }

        if (!sources?.agency_agents?.available) {
            dom.roleStudioReferenceList.innerHTML = '<div class="role-empty">agency-agents 目录未挂载，仍可使用 VCP 默认或 PromptX 生成。</div>';
            dom.roleStudioReferenceMeta.textContent = '';
            renderSelectedReferences(dom, [], summarizeInline);
            return;
        }

        renderSelectedReferences(dom, resolveSelectedReferenceItems(agencyItems, selectedIds), summarizeInline);

        if (agencyItems.length === 0) {
            dom.roleStudioReferenceList.innerHTML = '<div class="role-empty">没有匹配的参考模板。换个关键词再试。</div>';
            dom.roleStudioReferenceMeta.textContent = translateUiText(`agency-agents 共 ${sources.agency_agents.total || 0} 个模板。`);
            return;
        }

        for (const item of agencyItems) {
            dom.roleStudioReferenceList.appendChild(createReferenceCard(item, {
                selectedIds,
                toggleRoleStudioReference,
                summarizeInline
            }));
        }

        const selectedCount = selectedIds.size;
        const totalCount = sources.agency_agents.total || agencyItems.length;
        dom.roleStudioReferenceMeta.textContent = selectedCount
            ? translateUiText(`已选择 ${selectedCount} 个参考模板。生成时会作为 agency-agents 样本传给后端。`)
            : translateUiText(`显示 ${agencyItems.length} / ${totalCount} 个 agency-agents 模板。可不选，后端会按需求自动检索。`);
    }

    return {
        renderRoleStudioSources
    };
}
