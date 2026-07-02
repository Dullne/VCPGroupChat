export function buildWorkspaceRendererGroupDeps(deps) {
    const {
        getDom,
        getManagedProfile,
        getManagedTeam,
        getBootstrapData,
        isRoleInManagedTeam,
        isRoleInManagedProfile,
        removeRoleFromTeam,
        addRoleToTeam,
        getTeamDraftMode,
        getTeamDraftSelectedRoleIds,
        removeRoleFromTeamDraft,
        addRoleToTeamDraft,
        copyDefaultTeamMembersToDraft,
        removeRoleFromGroup,
        addRoleToGroup,
        personRuntimeActions,
        showToast,
        getProfilesForManagerView,
        getSessionProfile,
        setManagedProfile,
        renderAll,
        startSessionWithManagedProfile,
        duplicateManagedProfile,
        getProfileModeLabel,
        summarizeInline,
        getGroupProfileFormLoadedProfileId,
        getProfileById,
        getWorkspaceMode,
        getLauncherSelectedPersonIds,
        setLauncherSelectedPersonIds,
        getLauncherRoleFilterKeyword,
        getLauncherRoleTagFilter
    } = deps;

    return {
        teamMemberPoolDeps: {
            getDom,
            getManagedTeam,
            getBootstrapData,
            getTeamDraftMode,
            getTeamDraftSelectedRoleIds,
            isRoleInManagedTeam,
            addRoleToTeam,
            removeRoleFromTeam,
            addRoleToTeamDraft,
            removeRoleFromTeamDraft,
            copyDefaultTeamMembersToDraft,
            personRuntimeActions,
            showToast
        },
        launcherRolePickerDeps: {
            getDom,
            getWorkspaceMode,
            getBootstrapData,
            getManagedTeam,
            isRoleInManagedTeam,
            getLauncherSelectedPersonIds,
            setLauncherSelectedPersonIds,
            getLauncherRoleFilterKeyword,
            getLauncherRoleTagFilter,
            renderAll
        },
        groupMemberPoolDeps: {
            getDom,
            getManagedProfile,
            getManagedTeam,
            getBootstrapData,
            isRoleInManagedTeam,
            isRoleInManagedProfile,
            removeRoleFromGroup,
            addRoleToGroup,
            personRuntimeActions,
            showToast
        },
        groupProfileListDeps: {
            getDom,
            getBootstrapData,
            getProfilesForManagerView,
            getManagedProfile,
            getSessionProfile,
            setManagedProfile,
            renderAll,
            startSessionWithManagedProfile,
            duplicateManagedProfile,
            getProfileModeLabel,
            summarizeInline,
            showToast
        },
        groupProfileFormStatusDeps: {
            getDom,
            getManagedProfile,
            getGroupProfileFormLoadedProfileId,
            getProfileById
        }
    };
}
