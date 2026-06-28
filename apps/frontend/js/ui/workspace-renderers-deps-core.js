export function buildWorkspaceRendererModeAndTeamDeps(deps) {
    const {
        getDom,
        getWorkspaceMode,
        getFilteredTeams,
        getManagedTeamId,
        setManagedTeam,
        renderAll,
        getManagedTeam,
        getManagedTeamMembers,
        getBootstrapData
    } = deps;

    return {
        modeDeps: {
            getDom,
            getWorkspaceMode
        },
        teamListDeps: {
            getDom,
            getFilteredTeams,
            getManagedTeamId,
            getManagedTeamMembers,
            setManagedTeam,
            renderAll
        },
        teamSummaryDeps: {
            getDom,
            getManagedTeam,
            getManagedTeamMembers
        },
        teamFormStatusDeps: {
            getDom,
            getManagedTeam,
            getBootstrapData
        }
    };
}
