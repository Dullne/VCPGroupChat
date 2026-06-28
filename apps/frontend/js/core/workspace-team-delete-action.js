export function createWorkspaceTeamDeleteAction(deps) {
    const {
        fetchJson,
        showToast,
        getManagedTeam,
        getBootstrapData,
        refreshBootstrap,
        renderAll,
        getSelectedProfileId,
        setSelectedTeamId
    } = deps;

    return async function deleteManagedTeam() {
        const team = getManagedTeam();
        const bootstrapData = getBootstrapData();
        if (!team) {
            showToast('当前没有可删除团队', 'warning');
            return;
        }
        if (team.id === bootstrapData?.default_team_id) {
            showToast('默认团队不能删除', 'warning');
            return;
        }
        if (Number(team.profile_count || 0) > 0) {
            showToast(`团队仍关联 ${team.profile_count} 个历史群聊配置，无法删除`, 'warning');
            return;
        }

        const confirmed = window.confirm(`确认删除团队「${team.name}」吗？`);
        if (!confirmed) {
            return;
        }

        await fetchJson(`/api/teams/${encodeURIComponent(team.id)}`, {
            method: 'DELETE'
        });

        setSelectedTeamId(bootstrapData?.default_team_id || null);
        await refreshBootstrap(getSelectedProfileId());
        renderAll();
        showToast(`已删除团队：${team.name}`, 'success');
    };
}
