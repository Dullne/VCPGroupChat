export function resolveManagedTeamIdState(deps) {
    const {
        teams,
        selectedTeamId,
        domProfileId,
        selectedProfileId,
        activeSessionProfileId,
        getProfileById,
        resolveManagedTeamId,
        defaultTeamId,
        setSelectedTeamId
    } = deps;

    const normalizedSelectedTeamId = String(selectedTeamId || '').trim();
    if (normalizedSelectedTeamId && teams.some(team => team.id === normalizedSelectedTeamId)) {
        return normalizedSelectedTeamId;
    }

    const profileTeamId = getProfileById(selectedProfileId || activeSessionProfileId)?.team_id;
    if (profileTeamId && teams.some(team => team.id === profileTeamId)) {
        setSelectedTeamId(profileTeamId);
        return profileTeamId;
    }

    const fallback = resolveManagedTeamId(defaultTeamId);
    setSelectedTeamId(fallback);
    if (domProfileId) {
        const formProfileTeamId = getProfileById(domProfileId)?.team_id;
        if (formProfileTeamId && teams.some(team => team.id === formProfileTeamId)) {
            setSelectedTeamId(formProfileTeamId);
            return formProfileTeamId;
        }
    }
    return fallback;
}
