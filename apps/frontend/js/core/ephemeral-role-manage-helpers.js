export function findEphemeralRoleById(activeSession, ephemeralRoleId) {
    return (activeSession?.ephemeral_roles || []).find(role => role.id === ephemeralRoleId) || null;
}

export function buildDeleteEphemeralRoleConfirmText(ephemeralRole) {
    if (ephemeralRole.promoted_core_role_id) {
        return `临时角色「${ephemeralRole.name}」已长期化。删除后只会移除本会话记录，不会删除运行时角色。确认继续吗？`;
    }
    return `确认删除临时角色「${ephemeralRole.name}」吗？`;
}
