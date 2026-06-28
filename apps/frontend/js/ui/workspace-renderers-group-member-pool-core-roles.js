import { enrichWorkspaceRoleIdentity } from './workspace-renderers-team-member-pool-core-roles.js';

export function getWorkspaceGroupMemberPoolCoreRoles(bootstrapData, isRoleInManagedTeam = () => true) {
    return (bootstrapData?.roles || [])
        .filter(role => role.source !== 'ephemeral')
        .filter(role => isRoleInManagedTeam(role.id))
        .map(role => enrichWorkspaceRoleIdentity(role, bootstrapData))
        .sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id), 'zh-Hans-CN'));
}
