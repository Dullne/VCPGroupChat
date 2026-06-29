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
        getBootstrapData,
        getTeamDraftMode,
        getTeamDraftSelectedRoleIds,
        startTeamDraft,
        setTeamDraftMode
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
            getTeamDraftMode,
            getTeamDraftSelectedRoleIds,
            startTeamDraft,
            setTeamDraftMode,
            setManagedTeam,
            renderAll
        },
        teamSummaryDeps: {
            getDom,
            getManagedTeam,
            getManagedTeamMembers,
            getTeamDraftMode,
            getTeamDraftSelectedRoleIds
        },
        teamFormStatusDeps: {
            getDom,
            getManagedTeam,
            getBootstrapData,
            getTeamDraftMode,
            getTeamDraftSelectedRoleIds
        }
    };
}
