export function markRoundRoleSelectionBlockedItems(deps) {
    const {
        selectedIncludeRoleIds,
        selectableRoleMap,
        availableRoles,
        persistentlyMutedRoleNames,
        excludedRoleNamesForNextRound,
        baseCandidates,
        selectedMap,
        addBlockedReason
    } = deps;

    for (const roleId of selectedIncludeRoleIds) {
        const role = selectableRoleMap.get(roleId) || availableRoles.find(item => item.id === roleId);
        if (!role || role.active === false) {
            continue;
        }
        if (persistentlyMutedRoleNames.has(role.name)) {
            addBlockedReason(role, '手动点名');
            addBlockedReason(role, '已静音');
        } else if (excludedRoleNamesForNextRound.has(role.name)) {
            addBlockedReason(role, '手动点名');
            addBlockedReason(role, '本轮跳过');
        } else if (!baseCandidates.some(item => item.id === role.id) && !selectedMap.has(role.id)) {
            addBlockedReason(role, '手动点名');
            addBlockedReason(role, '不在群组候选');
        }
    }
}
