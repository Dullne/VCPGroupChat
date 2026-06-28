export function createWorkspaceTeamCreateAction(deps) {
    const {
        getDom,
        fetchJson,
        showToast,
        refreshBootstrap,
        renderAll,
        getBootstrapData,
        getSelectedProfileId,
        getSelectedTeamId,
        setSelectedTeamId
    } = deps;

    return async function createTeamFromForm() {
        const dom = getDom();
        const formData = new FormData(dom.teamForm);
        const name = String(formData.get('name') || '').trim();
        const description = String(formData.get('description') || '').trim();

        if (!name) {
            showToast('团队名称不能为空', 'warning');
            return;
        }

        const duplicateTeam = (getBootstrapData()?.teams || [])
            .find(team => String(team.name || '').trim() === name);
        if (duplicateTeam) {
            setSelectedTeamId(duplicateTeam.id);
            await refreshBootstrap(getSelectedProfileId());
            renderAll();
            showToast(`团队名称已存在，已切换到「${duplicateTeam.name}」`, 'warning');
            return;
        }

        try {
            const result = await fetchJson('/api/teams', {
                method: 'POST',
                body: { name, description }
            });

            dom.teamForm.reset();
            setSelectedTeamId(result.team?.id || getSelectedTeamId());
            await refreshBootstrap(getSelectedProfileId());
            renderAll();
            showToast(`已创建团队：${result.team?.name || name}`, 'success');
        } catch (error) {
            showToast(`创建团队失败：${error.message || '未知错误'}`, 'danger');
        }
    };
}
