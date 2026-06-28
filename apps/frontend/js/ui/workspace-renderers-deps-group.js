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
        getLauncherSelectedRoleIds,
        setLauncherSelectedRoleIds,
        getLauncherRoleFilterKeyword,
        getLauncherRoleTagFilter
    } = deps;

    return {
        teamMemberPoolDeps: {
            getDom,
            getManagedTeam,
            getBootstrapData,
            isRoleInManagedTeam,
            addRoleToTeam,
            removeRoleFromTeam,
            personRuntimeActions,
            showToast
        },
        launcherRolePickerDeps: {
            getDom,
            getWorkspaceMode,
            getBootstrapData,
            getManagedTeam,
            isRoleInManagedTeam,
            getLauncherSelectedRoleIds,
            setLauncherSelectedRoleIds,
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
