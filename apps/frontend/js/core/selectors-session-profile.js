export function createSessionProfileSelectors(deps) {
    const {
        getActiveSession,
        getBootstrapData
    } = deps;

    function getSessionProfileId() {
        return getActiveSession()?.profile_id || getBootstrapData()?.default_profile_id || null;
    }

    function getSessionProfile() {
        const profileId = getSessionProfileId();
        return (getBootstrapData()?.profiles || []).find(profile => profile.id === profileId) || null;
    }

    function getSessionProfileMemberIds() {
        const profile = getSessionProfile();
        return new Set((profile?.members || []).filter(member => member.enabled).map(member => member.role_id));
    }

    function isRoleInSessionProfile(roleId) {
        return getSessionProfileMemberIds().has(roleId);
    }

    return {
        getSessionProfileId,
        getSessionProfile,
        getSessionProfileMemberIds,
        isRoleInSessionProfile
    };
}
