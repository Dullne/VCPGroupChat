export function createManagedProfileMemberSelectors(deps) {
    const { getManagedProfile } = deps;

    function getManagedProfileMemberIds() {
        const profile = getManagedProfile();
        return new Set((profile?.members || []).filter(member => member.enabled).map(member => member.role_id));
    }

    function getManagedProfileMember(roleId) {
        const profile = getManagedProfile();
        return (profile?.members || []).find(member => member.enabled && member.role_id === roleId) || null;
    }

    function getManagedProfileMemberPosition(roleId) {
        const profile = getManagedProfile();
        const members = (profile?.members || [])
            .filter(member => member.enabled)
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
        const profile = getManagedProfile();
        return (profile?.members || []).filter(member => member.enabled).length;
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
