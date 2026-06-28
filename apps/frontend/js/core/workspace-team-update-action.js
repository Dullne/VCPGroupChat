export function createWorkspaceTeamUpdateAction(deps) {
    const {
        getDom,
        fetchJson,
        showToast,
        getManagedTeam,
        getBootstrapData,
        refreshBootstrap,
        renderAll,
        getSelectedProfileId
    } = deps;

    return async function updateManagedTeamFromForm() {
        const dom = getDom();
        const team = getManagedTeam();
        const bootstrapData = getBootstrapData();
        if (!team) {
            showToast('当前没有可编辑团队', 'warning');
            return;
        }
        if (team.id === bootstrapData?.default_team_id) {
            showToast('默认团队暂不支持直接重命名', 'warning');
            return;
        }

        const formData = new FormData(dom.teamForm);
        const name = String(formData.get('name') || '').trim();
        const description = String(formData.get('description') || '').trim();
        if (!name) {
            showToast('团队名称不能为空', 'warning');
            return;
        }

        await fetchJson(`/api/teams/${encodeURIComponent(team.id)}`, {
            method: 'PATCH',
            body: { name, description }
        });

        await refreshBootstrap(getSelectedProfileId());
        renderAll();
        showToast(`已更新团队：${name}`, 'success');
    };
}
