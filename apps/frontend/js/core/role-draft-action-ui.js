import { translateUiText } from './i18n.js';
export function setRoleDraftLoadingUi(dom) {
    dom.draftRoleIdeaBtn.disabled = true;
    dom.clearRoleIdeaBtn.disabled = true;
    dom.roleIdeaStatus.textContent = '正在根据当前群组上下文生成角色草稿...';
    dom.roleIdeaStatus.className = 'profile-form-status';
}

export function restoreRoleDraftUi(dom, renderRoleStudio) {
    dom.draftRoleIdeaBtn.disabled = false;
    dom.clearRoleIdeaBtn.disabled = false;
    renderRoleStudio();
}

export function applyRoleDraftResult(deps) {
    const {
        dom,
        draft,
        draftMeta,
        usedFallback,
        describeRoleDraftGeneration,
        setLatestRoleDraft,
        setLatestRoleDraftMeta,
        setAdvancedRoleEditorExpanded,
        applyRoleDraftToForm,
        buildRoleDraftStatusState
    } = deps;

    setLatestRoleDraft(draft);
    setLatestRoleDraftMeta(draftMeta);
    setAdvancedRoleEditorExpanded(false);
    applyRoleDraftToForm(draft);

    const status = buildRoleDraftStatusState({
        draft,
        draftMeta,
        usedFallback,
        describeRoleDraftGeneration
    });
    dom.roleIdeaStatus.textContent = translateUiText(status.text);
    dom.roleIdeaStatus.className = status.className;
}
