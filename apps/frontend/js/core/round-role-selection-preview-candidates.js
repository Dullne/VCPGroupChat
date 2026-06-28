export function buildRoundRoleBaseCandidates(deps) {
    const {
        automaticRoles,
        persistentlyMutedRoleNames,
        excludedRoleNamesForNextRound,
        addBlockedReason
    } = deps;

    const baseCandidates = [];
    for (const role of automaticRoles) {
        if (persistentlyMutedRoleNames.has(role.name)) {
            addBlockedReason(role, '已静音');
            continue;
        }
        if (excludedRoleNamesForNextRound.has(role.name)) {
            addBlockedReason(role, '本轮跳过');
            continue;
        }
        baseCandidates.push(role);
    }

    return baseCandidates;
}

export function buildRoundRoleIncludeRoleSet(deps) {
    const {
        selectedIncludeRoleIds,
        selectableRoleMap,
        availableRoles,
        persistentlyMutedRoleNames,
        excludedRoleNamesForNextRound
    } = deps;

    const includeRoleIds = [...selectedIncludeRoleIds].filter(roleId => {
        const role = selectableRoleMap.get(roleId) || availableRoles.find(item => item.id === roleId);
        if (!role || role.active === false) {
            return false;
        }
        if (persistentlyMutedRoleNames.has(role.name) || excludedRoleNamesForNextRound.has(role.name)) {
            return false;
        }
        return true;
    });

    return new Set(includeRoleIds);
}
