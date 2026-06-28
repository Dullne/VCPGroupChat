export function buildWorkspaceRendererCurrentProfileSummaryDeps(deps) {
    const {
        getDom,
        getBootstrapData,
        getManagedProfile,
        getTeamById,
        summarizeInline,
        getProfileModeDetail,
        getProfileModeLabel,
        getSessionProfile,
        formatDateTime
    } = deps;

    return {
        currentProfileSummaryDeps: {
            getDom,
            getBootstrapData,
            getManagedProfile,
            getTeamById,
            summarizeInline,
            getProfileModeDetail,
            getProfileModeLabel,
            getSessionProfile,
            formatDateTime
        }
    };
}
