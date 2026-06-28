export function createClearRoleIdeaDraftAction(deps) {
    const {
        getDom,
        setLatestRoleDraft,
        setLatestRoleDraftMeta,
        setAdvancedRoleEditorExpanded,
        renderRoleStudio
    } = deps;

    return function clearRoleIdeaDraft() {
        const dom = getDom();
        dom.roleIdeaForm.reset();
        dom.ephemeralRoleForm.reset();
        setLatestRoleDraft(null);
        setLatestRoleDraftMeta(null);
        setAdvancedRoleEditorExpanded(false);
        dom.roleIdeaStatus.textContent = '先输入一句话需求，再生成角色草稿。';
        dom.roleIdeaStatus.className = 'profile-form-status';
        renderRoleStudio();
    };
}
