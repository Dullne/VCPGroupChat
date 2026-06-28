import { translateUiText } from '../core/i18n.js';
function renderRoleDraftMetaBadges(dom, latestRoleDraftMeta, buildRoleDraftMetaLabels) {
    dom.roleDraftMeta.innerHTML = '';
    const metaLabels = buildRoleDraftMetaLabels(latestRoleDraftMeta);
    dom.roleDraftMeta.classList.toggle('role-draft-content-hidden', metaLabels.length === 0);
    for (const label of metaLabels) {
        const badge = document.createElement('span');
        badge.className = 'role-badge';
        badge.textContent = label;
        dom.roleDraftMeta.appendChild(badge);
    }
}

function renderRoleDraftMemoryBadges(dom, draft) {
    dom.roleDraftMemory.innerHTML = '';

    for (const label of [
        translateUiText(`私有记忆：${draft.privateNotebook || translateUiText('未命名')}`),
        translateUiText(`知识记忆：${draft.knowledgeNotebook || translateUiText('未命名')}`),
        draft.model ? translateUiText(`角色固定模型：${draft.model}`) : null
    ]) {
        if (!label) {
            continue;
        }
        const badge = document.createElement('span');
        badge.className = 'role-badge';
        badge.textContent = label;
        dom.roleDraftMemory.appendChild(badge);
    }
}

function renderRoleDraftResponsibilities(dom, draft) {
    dom.roleDraftResponsibilities.innerHTML = '';
    for (const responsibility of draft.responsibilities || []) {
        const item = document.createElement('div');
        item.className = 'role-draft-list-item';
        item.textContent = responsibility;
        dom.roleDraftResponsibilities.appendChild(item);
    }
    if (dom.roleDraftResponsibilities.childElementCount === 0) {
        const empty = document.createElement('div');
        empty.className = 'role-empty';
        empty.textContent = '还没有明确职责。建议补一句更具体的角色需求。';
        dom.roleDraftResponsibilities.appendChild(empty);
    }
}

export function applyRoleStudioFilledDraftState(deps) {
    const {
        dom,
        draft,
        latestRoleDraftMeta,
        buildRoleDraftMetaLabels,
        summarizeInline
    } = deps;

    const hasName = !!String(draft.name || '').trim();
    dom.createRoleFromDraftBtn.disabled = !hasName;
    dom.saveRoleDraftBtn.disabled = !hasName;
    dom.saveRoleDraftTeamBtn.disabled = !hasName;
    dom.saveRoleDraftGroupBtn.disabled = !hasName;
    dom.roleDraftName.textContent = draft.name || '未命名角色';
    dom.roleDraftDescription.textContent = draft.description || '暂无角色说明';

    renderRoleDraftMetaBadges(dom, latestRoleDraftMeta, buildRoleDraftMetaLabels);
    renderRoleDraftMemoryBadges(dom, draft);
    renderRoleDraftResponsibilities(dom, draft);

    dom.roleDraftPersona.textContent = draft.persona || '暂无认知草稿';
    dom.roleDraftTemplate.textContent = summarizeInline(draft.template || '', 220) || '暂无模板摘要';
}
