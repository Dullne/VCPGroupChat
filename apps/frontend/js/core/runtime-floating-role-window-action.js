export function createFloatingRoleWindowUpdater(deps) {
    const {
        getDom,
        getPersistentlyMutedRoleNames,
        getExcludedRoleNamesForNextRound,
        clearLatestSelectionTrace,
        saveMutedRoleNames,
        renderRoleSelectionSummary,
        renderFloatingRoleWindow,
        buildAvatarDataUrl
    } = deps;

    function updateFloatingRoleWindow(roles, speakingRoleIds = []) {
        const dom = getDom();
        const persistentlyMutedRoleNames = getPersistentlyMutedRoleNames();
        const excludedRoleNamesForNextRound = getExcludedRoleNamesForNextRound();
        renderFloatingRoleWindow({
            container: dom.currentRoundAisContainer,
            statusWindow: dom.floatingAiStatusWindow,
            roles,
            speakingRoleIds,
            buildAvatarDataUrl,
            isMuted: role => persistentlyMutedRoleNames.has(role.name),
            isExcluded: role => excludedRoleNamesForNextRound.has(role.name),
            onToggleMuted: role => {
                clearLatestSelectionTrace();
                if (persistentlyMutedRoleNames.has(role.name)) {
                    persistentlyMutedRoleNames.delete(role.name);
                } else {
                    persistentlyMutedRoleNames.add(role.name);
                }
                saveMutedRoleNames();
                updateFloatingRoleWindow(roles, speakingRoleIds);
                renderRoleSelectionSummary();
            },
            onToggleExcluded: role => {
                clearLatestSelectionTrace();
                if (excludedRoleNamesForNextRound.has(role.name)) {
                    excludedRoleNamesForNextRound.delete(role.name);
                } else {
                    excludedRoleNamesForNextRound.add(role.name);
                }
                updateFloatingRoleWindow(roles, speakingRoleIds);
                renderRoleSelectionSummary();
            }
        });
    }

    return updateFloatingRoleWindow;
}
