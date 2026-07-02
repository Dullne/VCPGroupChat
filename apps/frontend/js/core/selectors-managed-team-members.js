export function createManagedTeamMemberSelectors(deps) {
    const {
        getManagedTeamId,
        getBootstrapData
    } = deps;

    function normalizeTeamPersonMember(member) {
        const roleId = String(member?.legacy_role_id || member?.person?.legacy_role_id || '').trim();
        return {
            ...member,
            role_id: roleId,
            role_name: member?.person_name || member?.person?.display_name || roleId,
            role_order: Number(member?.member_order || 0),
            enabled: member?.enabled !== false,
            identity_kind: 'person'
        };
    }

    function getManagedTeamMembers() {
        const managedTeamId = getManagedTeamId();
        if (!managedTeamId) {
            return [];
        }

        const bootstrapData = getBootstrapData();
        const membersByTeamId = bootstrapData?.team_person_members_by_team_id;
        const members = Array.isArray(membersByTeamId?.[managedTeamId])
            ? membersByTeamId[managedTeamId]
            : [];

        return members
            .filter(member => member?.enabled !== false)
            .map(normalizeTeamPersonMember)
            .filter(member => member.role_id);
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
