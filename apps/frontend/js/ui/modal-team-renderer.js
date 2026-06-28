export function createModalTeamRenderer(deps) {
    const {
        state,
        getDocument
    } = deps;

    function renderTeamManager() {
        const teamList = getDocument().getElementById('team-list');
        if (!teamList) {
            return;
        }

        const teams = state.teams || [];
        teamList.innerHTML = teams.map(team => `
        <div class="team-item ${team.id === state.selectedTeamId ? 'active' : ''}" data-team-id="${team.id}">
            <div class="team-name">${team.name}</div>
            <div class="team-description">${team.description || ''}</div>
        </div>
    `).join('');

        teamList.querySelectorAll('.team-item').forEach(item => {
            item.addEventListener('click', () => {
                const teamId = item.dataset.teamId;
                selectTeam(teamId);
            });
        });
    }

    function renderRoleStudio() {
        // TODO: 实现角色工坊渲染
    }

    function renderRoleLibrary() {
        // TODO: 实现角色库渲染
    }

    function selectTeam(teamId) {
        state.selectedTeamId = teamId;
        renderTeamManager();
    }

    return {
        renderTeamManager,
        renderRoleStudio,
        renderRoleLibrary,
        selectTeam
    };
}
