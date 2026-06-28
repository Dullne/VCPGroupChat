export function resolveManagedProfileId(deps) {
    const {
        managedTeamId,
        selectedProfileId,
        domProfileId,
        activeSessionProfileId,
        bootstrapData,
        getProfileById
    } = deps;

    const candidates = [
        selectedProfileId,
        domProfileId,
        activeSessionProfileId,
        bootstrapData?.default_profile_id
    ].filter(Boolean);

    for (const profileId of candidates) {
        const profile = getProfileById(profileId);
        if (!profile) {
            continue;
        }
        if (!managedTeamId || String(profile.team_id || '') === managedTeamId) {
            return profile.id;
        }
    }

    const fallbackProfile = (bootstrapData?.profiles || []).find(profile => {
        if (!managedTeamId) {
            return true;
        }
        return String(profile.team_id || '') === managedTeamId;
    });

    return fallbackProfile?.id || null;
}
