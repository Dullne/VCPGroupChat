export function applyManagedProfileSelection(deps) {
    const {
        profileId,
        setSelectedProfileId,
        getProfileById,
        setSelectedTeamId,
        resolveManagedTeamId,
        getDom
    } = deps;

    if (!profileId) {
        return;
    }
    setSelectedProfileId(profileId);
    const profile = getProfileById(profileId);
    if (profile?.team_id) {
        setSelectedTeamId(resolveManagedTeamId(profile.team_id));
    }
    getDom().profileSelect.value = profileId;
}
