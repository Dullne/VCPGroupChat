export function createModalTeamActions(deps) {
    const {
        state,
        fetchJson,
        showToast,
        showLoading,
        hideLoading,
        renderTeamManager,
        confirmDelete
    } = deps;

    async function createTeam(data) {
        try {
            showLoading('创建团队中...');
            const result = await fetchJson('/api/teams', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            const bootstrap = await fetchJson('/api/bootstrap');
            state.teams = bootstrap.teams || [];
            state.selectedTeamId = result.id;

            renderTeamManager();
            hideLoading();
            showToast('团队创建成功', 'success');
            return result;
        } catch (error) {
            hideLoading();
            showToast(`创建失败：${error.message}`, 'danger');
            throw error;
        }
    }

    async function deleteTeam(teamId) {
        if (!confirmDelete('确定删除此团队？')) {
            return;
        }

        try {
            showLoading('删除中...');
            await fetchJson(`/api/teams/${teamId}`, { method: 'DELETE' });

            const bootstrap = await fetchJson('/api/bootstrap');
            state.teams = bootstrap.teams || [];
            state.selectedTeamId = bootstrap.default_team_id;

            renderTeamManager();
            hideLoading();
            showToast('团队已删除', 'success');
        } catch (error) {
            hideLoading();
            showToast(`删除失败：${error.message}`, 'danger');
        }
    }

    return {
        createTeam,
        deleteTeam
    };
}
