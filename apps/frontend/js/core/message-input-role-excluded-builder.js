export function buildExcludedRoleIdsFromAutomaticRoles(deps) {
    const {
        automaticRoles,
        persistentlyMutedRoleNames,
        excludedRoleNamesForNextRound
    } = deps;

    return automaticRoles
        .filter(role =>
            persistentlyMutedRoleNames.has(role.name) ||
            excludedRoleNamesForNextRound.has(role.name)
        )
        .map(role => role.id);
}
