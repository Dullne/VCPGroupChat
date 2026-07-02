export function createManagedProfileMemberSelectors(deps) {
    const {
        getManagedProfile,
        getBootstrapData
    } = deps;

    function normalizeGroupPersonMember(member) {
        const roleId = String(member?.legacy_role_id || member?.person?.legacy_role_id || '').trim();
        return {
            ...member,
            person_id: member?.person_id || member?.person?.id || '',
            role_id: roleId,
            role_name: member?.group_alias || member?.person_name || member?.person?.display_name || roleId,
            role_order: Number(member?.member_order || 0),
            enabled: member?.enabled !== false,
            identity_kind: 'person'
        };
    }

    function getManagedProfileMembers() {
        const profile = getManagedProfile();
        if (!profile?.id) {
            return [];
        }

        const membersByProfileId = getBootstrapData()?.group_person_members_by_profile_id || {};
        const members = Array.isArray(membersByProfileId?.[profile.id])
            ? membersByProfileId[profile.id]
            : [];

        return members
            .filter(member => member?.enabled !== false)
            .map(normalizeGroupPersonMember)
            .filter(member => member.person_id);
    }

    function getManagedProfileMemberIds() {
        return new Set(getManagedProfileMembers().map(member => member.role_id).filter(Boolean));
    }

    function getManagedProfileMember(roleId) {
        return getManagedProfileMembers().find(member => member.role_id === roleId) || null;
    }

    function getManagedProfileMemberPosition(roleId) {
        const members = getManagedProfileMembers()
            .sort((a, b) => {
                const orderDiff = Number(a.role_order || 0) - Number(b.role_order || 0);
                if (orderDiff !== 0) {
                    return orderDiff;
                }
                return String(a.role_name || a.role_id).localeCompare(String(b.role_name || b.role_id), 'zh-Hans-CN');
            });

        return members.findIndex(member => member.role_id === roleId) + 1;
    }

    function getManagedProfileEnabledMemberCount() {
        return getManagedProfileMembers().length;
    }

    function isRoleInManagedProfile(roleId) {
        return getManagedProfileMemberIds().has(roleId);
    }

    return {
        getManagedProfileMemberIds,
        getManagedProfileMember,
        getManagedProfileMemberPosition,
        getManagedProfileEnabledMemberCount,
        isRoleInManagedProfile
    };
}
