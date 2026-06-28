export function createSessionRoleListSelectors(deps) {
    const {
        getAvailableRoles,
        getManagedProfile,
        getSessionProfile,
        getSessionProfileMemberIds
    } = deps;

    function getSortedRolesForPanel(roles = getAvailableRoles(), { profile = getManagedProfile() } = {}) {
        const memberIds = new Set((profile?.members || []).filter(member => member.enabled).map(member => member.role_id));
        const roleOrderMap = new Map(
            (profile?.members || []).map(member => [member.role_id, member.role_order || 9999])
        );

        return [...roles].sort((a, b) => {
            const aGroup = memberIds.has(a.id) ? 0 : (a.source === 'ephemeral' ? 1 : 2);
            const bGroup = memberIds.has(b.id) ? 0 : (b.source === 'ephemeral' ? 1 : 2);
            if (aGroup !== bGroup) {
                return aGroup - bGroup;
            }

            const aOrder = roleOrderMap.get(a.id) ?? 9999;
            const bOrder = roleOrderMap.get(b.id) ?? 9999;
            if (aOrder !== bOrder) {
                return aOrder - bOrder;
            }

            return String(a.name || a.id).localeCompare(String(b.name || b.id), 'zh-Hans-CN');
        });
    }

    function getSelectableRoles() {
        const roleMap = new Map();
        for (const role of getAvailableRoles()) {
            if (role.active === false) {
                continue;
            }
            roleMap.set(role.id, role);
        }
        return getSortedRolesForPanel([...roleMap.values()], { profile: getSessionProfile() });
    }

    function getAutomaticParticipantRoles() {
        const memberIds = getSessionProfileMemberIds();
        return getSortedRolesForPanel(
            getAvailableRoles().filter(role => {
                if (role.source === 'ephemeral') {
                    return role.promoted_core_role_id ? false : role.active !== false;
                }
                return memberIds.has(role.id);
            }),
            { profile: getSessionProfile() }
        );
    }

    return {
        getSortedRolesForPanel,
        getSelectableRoles,
        getAutomaticParticipantRoles
    };
}
