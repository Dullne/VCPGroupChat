export function createSessionCreateAction(deps) {
    const {
        getDom,
        getBootstrapData,
        getActiveSession,
        setActiveSession,
        clearLatestSelectionTrace,
        clearSelectedIncludeRoleIds,
        clearExcludedRoleNamesForNextRound,
        getProfileById,
        getSelectedProfileId,
        setSelectedProfileId,
        resolveManagedTeamId,
        setSelectedTeamId,
        renderProfileSelectOptions,
        refreshBootstrap,
        refreshSessionsList,
        fetchJson,
        reloadActiveSessionAndRoles
    } = deps;

    return async function createSession(profileIdOverride = null) {
        const dom = getDom();
        const bootstrapData = getBootstrapData();
        clearLatestSelectionTrace();
        const targetProfileId = profileIdOverride || dom.profileSelect.value || bootstrapData.default_profile_id;
        const created = await fetchJson('/api/group-chat/sessions', {
            method: 'POST',
            body: {
                profile_id: targetProfileId
            }
        });

        clearSelectedIncludeRoleIds();
        clearExcludedRoleNamesForNextRound();
        setActiveSession(created.session);

        const activeSession = getActiveSession();
        const nextSelectedProfileId = activeSession?.profile_id || getSelectedProfileId();
        setSelectedProfileId(nextSelectedProfileId);
        const activeProfile = getProfileById(nextSelectedProfileId);
        if (activeProfile?.team_id) {
            setSelectedTeamId(resolveManagedTeamId(activeProfile.team_id));
        }
        await refreshBootstrap(nextSelectedProfileId);
        await refreshSessionsList();
        await reloadActiveSessionAndRoles();
        renderProfileSelectOptions(nextSelectedProfileId);
    };
}
