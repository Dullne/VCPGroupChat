export function resolveManagedProfileForGroupRoleActions(deps) {
    const {
        getManagedProfile,
        showToast,
        toastWhenMissing = false
    } = deps;

    const profile = getManagedProfile();
    if (!profile && toastWhenMissing) {
        showToast('当前没有可用群聊配置', 'warning');
    }
    return profile || null;
}

export function resolveManagedTeamIdForRoleActions(deps) {
    const {
        getManagedTeamId,
        showToast,
        toastWhenMissing = false
    } = deps;

    const teamId = getManagedTeamId();
    if (!teamId && toastWhenMissing) {
        showToast('当前没有可用团队', 'warning');
    }
    return teamId || null;
}

function resolveRoleForRoleAction(deps) {
    const {
        roleId,
        getAvailableRoles,
        getBootstrapData
    } = deps;

    const availableRoles = getAvailableRoles();
    const bootstrapData = getBootstrapData();
    return availableRoles.find(item => item.id === roleId)
        || (bootstrapData.roles || []).find(item => item.id === roleId)
        || null;
}

export function resolvePersonIdentityForRoleAction(deps) {
    const {
        roleId,
        getBootstrapData
    } = deps;

    const role = resolveRoleForRoleAction(deps);
    if (role?.person_identity) {
        return role.person_identity;
    }

    const bootstrapData = getBootstrapData();
    const persons = bootstrapData.persons || [];
    return persons.find(person => person?.legacy_role_id === roleId)
        || persons.find(person => role?.person_id && person?.id === role.person_id)
        || null;
}

export function resolveRoleNameForGroupAction(deps) {
    const role = resolveRoleForRoleAction(deps);
    const { roleId } = deps;
    return role?.name || roleId;
}
