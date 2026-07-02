export function createRuntimeInteractionRoleLibraryBridges(deps) {
    const { runtime } = deps;

    const addRoleToTeam = roleId => runtime.roleLibraryActions.addRoleToTeam(roleId);
    const removeRoleFromTeam = roleId => runtime.roleLibraryActions.removeRoleFromTeam(roleId);
    const addRoleToTeamDraft = roleId => runtime.roleLibraryActions.addRoleToTeamDraft(roleId);
    const removeRoleFromTeamDraft = roleId => runtime.roleLibraryActions.removeRoleFromTeamDraft(roleId);
    const addRoleToGroup = roleId => runtime.roleLibraryActions.addRoleToGroup(roleId);
    const removeRoleFromGroup = roleId => runtime.roleLibraryActions.removeRoleFromGroup(roleId);
    const moveRoleInManagedProfile = (roleId, direction) => runtime.roleLibraryActions.moveRoleInManagedProfile(roleId, direction);
    const personRuntimeActions = {
        bindRuntimeRole: (personId, roleId) => runtime.roleLibraryActions.bindPersonRuntimeRole(personId, roleId),
        generateRuntimeRole: personId => runtime.roleLibraryActions.generatePersonRuntimeRole(personId),
        repairMissingRuntimeRoles: personIds => runtime.roleLibraryActions.repairMissingRuntimeRoles(personIds),
        enrichSparseProfiles: personIds => runtime.roleLibraryActions.enrichSparsePersonProfiles(personIds)
    };

    return {
        addRoleToTeam,
        removeRoleFromTeam,
        addRoleToTeamDraft,
        removeRoleFromTeamDraft,
        addRoleToGroup,
        removeRoleFromGroup,
        moveRoleInManagedProfile,
        personRuntimeActions
    };
}
