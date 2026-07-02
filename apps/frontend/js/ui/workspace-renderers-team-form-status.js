export function renderWorkspaceTeamFormStatus(deps) {
    const {
        getDom,
        getManagedTeam,
        getBootstrapData,
        getTeamDraftMode,
        getTeamDraftSelectedRoleIds
    } = deps;

    const dom = getDom();
    if (!dom.teamFormStatus) {
        return;
    }
    const draftMode = getTeamDraftMode?.() === true;
    const selectedDraftCount = getTeamDraftSelectedRoleIds?.().size || 0;
    if (dom.createTeamBtn) {
        dom.createTeamBtn.textContent = `创建团队并加入 ${selectedDraftCount} 人`;
        dom.createTeamBtn.disabled = !draftMode || selectedDraftCount < 1;
    }
    if (draftMode) {
        dom.teamFormStatus.textContent = selectedDraftCount > 0
            ? `团队草稿：已选 ${selectedDraftCount} 个人物，填写名称后创建。`
            : '团队草稿：先从右侧选择至少 1 个人物。';
        dom.teamFormStatus.className = selectedDraftCount > 0
            ? 'profile-form-status profile-form-status-ready'
            : 'profile-form-status profile-form-status-warning';
        dom.updateTeamBtn.disabled = true;
        dom.deleteTeamBtn.disabled = true;
        return;
    }

    const team = getManagedTeam();
    const bootstrapData = getBootstrapData();
    if (!team) {
        dom.teamFormStatus.textContent = '先创建或选择团队。';
        dom.teamFormStatus.className = 'profile-form-status';
        dom.updateTeamBtn.disabled = true;
        dom.deleteTeamBtn.disabled = true;
        return;
    }

    dom.teamFormStatus.textContent = team.id === bootstrapData?.default_team_id
        ? '当前是默认团队：承载系统默认人物池，暂不支持删除与重命名。'
        : `当前管理团队：${team.name}。你可以更新描述；如仍有关联群聊配置，系统会阻止删除。`;
    dom.teamFormStatus.className = team.id === bootstrapData?.default_team_id
        ? 'profile-form-status profile-form-status-warning'
        : 'profile-form-status profile-form-status-ready';
    dom.updateTeamBtn.disabled = team.id === bootstrapData?.default_team_id;
    dom.deleteTeamBtn.disabled =
        team.id === bootstrapData?.default_team_id ||
        Number(team.profile_count || 0) > 0;
}
