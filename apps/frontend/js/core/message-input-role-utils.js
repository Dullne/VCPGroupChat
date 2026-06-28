export function filterAllowedRoleIds(roleIds, deps) {
    const {
        availableRoles,
        persistentlyMutedRoleNames,
        excludedRoleNamesForNextRound
    } = deps;

    return roleIds.filter(roleId => {
        const role = availableRoles.find(item => item.id === roleId);
        if (!role || role.active === false) {
            return false;
        }
        if (persistentlyMutedRoleNames.has(role.name) || excludedRoleNamesForNextRound.has(role.name)) {
            return false;
        }
        return true;
    });
}

export function countAutomaticCandidates(deps) {
    const {
        automaticRoles,
        persistentlyMutedRoleNames,
        excludedRoleNamesForNextRound
    } = deps;

    return automaticRoles.filter(
        role => !persistentlyMutedRoleNames.has(role.name) && !excludedRoleNamesForNextRound.has(role.name)
    ).length;
}
