export function createRuntimeInteractionUiSessionWorkspaceBridges(deps) {
    const { runtime } = deps;

    const initialize = (...args) => runtime.bootstrapActions.initialize(...args);
    const refreshBootstrap = (preferredProfileId = null) => runtime.bootstrapActions.refreshBootstrap(preferredProfileId);
    const setManagedProfile = profileId => runtime.teamProfileManager.setManagedProfile(profileId);
    const setManagedTeam = (teamId, { alignProfile = true } = {}) =>
        runtime.teamProfileManager.setManagedTeam(teamId, { alignProfile });
    const renderProfileSelectOptions = (preferredProfileId = null) =>
        runtime.teamProfileManager.renderProfileSelectOptions(preferredProfileId);
    const refreshImportSources = (...args) => runtime.bootstrapActions.refreshImportSources(...args);
    const openWorkspace = mode => runtime.bootstrapActions.openWorkspace(mode);
    const refreshSessionsList = (...args) => runtime.sessionManager.refreshSessionsList(...args);
    const reloadActiveSessionAndRoles = (...args) => runtime.sessionManager.reloadActiveSessionAndRoles(...args);
    const switchSession = sessionId => runtime.sessionManager.switchSession(sessionId);
    const createSession = (profileIdOverride = null) => runtime.sessionManager.createSession(profileIdOverride);

    return {
        initialize,
        refreshBootstrap,
        setManagedProfile,
        setManagedTeam,
        renderProfileSelectOptions,
        refreshImportSources,
        openWorkspace,
        refreshSessionsList,
        reloadActiveSessionAndRoles,
        switchSession,
        createSession
    };
}
