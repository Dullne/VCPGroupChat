export function createSessionSwitchAction(deps) {
    const {
        getDom,
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
        renderAll,
        reloadActiveSessionAndRoles
    } = deps;

    return async function switchSession(sessionId) {
        const dom = getDom();
        clearLatestSelectionTrace();
        clearSelectedIncludeRoleIds();
        clearExcludedRoleNamesForNextRound();

        setActiveSession({ id: sessionId, profile_id: dom.profileSelect.value });
        await reloadActiveSessionAndRoles();

        const activeSession = getActiveSession();
        const nextSelectedProfileId = activeSession?.profile_id || getSelectedProfileId();
        setSelectedProfileId(nextSelectedProfileId);

        const sessionProfile = getProfileById(nextSelectedProfileId);
        if (sessionProfile?.team_id) {
            setSelectedTeamId(resolveManagedTeamId(sessionProfile.team_id));
        }
        renderProfileSelectOptions(nextSelectedProfileId);
        dom.sessionSelect.value = activeSession.id;

        document.querySelectorAll('.session-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === sessionId);
        });

        renderAll();
    };
}
