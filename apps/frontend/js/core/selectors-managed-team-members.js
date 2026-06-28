export function createManagedTeamMemberSelectors(deps) {
    const {
        getManagedTeamId,
        getBootstrapData
    } = deps;

    function getManagedTeamMembers() {
        const managedTeamId = getManagedTeamId();
        if (!managedTeamId) {
            return [];
        }

        const bootstrapData = getBootstrapData();
        const membersByTeamId = bootstrapData?.team_members_by_team_id;
        const members = Array.isArray(membersByTeamId?.[managedTeamId])
            ? membersByTeamId[managedTeamId]
            : [];

        if (members.length > 0) {
            return members.filter(member => member?.enabled !== false);
        }

        // Backward compatibility fallback for legacy bootstrap payloads.
        const roleMap = new Map();
        for (const profile of bootstrapData?.profiles || []) {
            if (String(profile?.team_id || '') !== String(managedTeamId)) {
                continue;
            }
            for (const member of profile.members || []) {
                if (!member?.enabled || !member.role_id) {
                    continue;
                }
                if (!roleMap.has(member.role_id)) {
                    roleMap.set(member.role_id, {
                        role_id: member.role_id,
                        role_name: member.role_name || member.role_id,
                        role_order: Number(member.role_order || 0),
                        enabled: true
                    });
                }
            }
        }
        return [...roleMap.values()];
    }

    function getManagedTeamMemberIds() {
        return new Set(getManagedTeamMembers().map(member => member.role_id));
    }

    function isRoleInManagedTeam(roleId) {
        return getManagedTeamMemberIds().has(roleId);
    }

    return {
        getManagedTeamMembers,
        getManagedTeamMemberIds,
        isRoleInManagedTeam
    };
}
