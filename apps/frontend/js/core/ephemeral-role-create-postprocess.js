export function finalizeEphemeralRoleCreation(deps) {
    const {
        dom,
        name,
        setLatestRoleDraft,
        setLatestRoleDraftMeta,
        setAdvancedRoleEditorExpanded
    } = deps;

    dom.roleIdeaForm.reset();
    dom.ephemeralRoleForm.reset();
    setLatestRoleDraft(null);
    setLatestRoleDraftMeta(null);
    setAdvancedRoleEditorExpanded(false);
    dom.roleIdeaStatus.textContent = `已创建临时角色「${name}」。如需长期保留，可在人物与模板中执行长期化。`;
    dom.roleIdeaStatus.className = 'profile-form-status profile-form-status-ready';
}
