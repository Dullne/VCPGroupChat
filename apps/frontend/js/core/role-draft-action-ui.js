import { translateUiText } from './i18n.js';

export function setRoleDraftLoadingUi(dom) {
    dom.draftRoleIdeaBtn.disabled = true;
    dom.clearRoleIdeaBtn.disabled = true;
    dom.roleIdeaStatus.textContent = '正在根据当前群组上下文生成角色草稿...';
    dom.roleIdeaStatus.className = 'profile-form-status';
}

function revealRoleDraftPreview(dom) {
    const revealTarget = dom.roleDraftPreview || dom.roleDraftContent;
    if (!revealTarget?.scrollIntoView) {
        return;
    }

    const reveal = () => {
        revealTarget.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
        });
        revealTarget.focus?.({ preventScroll: true });
    };

    if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(reveal);
        return;
    }
    setTimeout(reveal, 0);
}

export function restoreRoleDraftUi(dom, renderRoleStudio, options = {}) {
    dom.draftRoleIdeaBtn.disabled = false;
    dom.clearRoleIdeaBtn.disabled = false;
    renderRoleStudio();
    if (options.revealDraftPreview) {
        revealRoleDraftPreview(dom);
    }
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
