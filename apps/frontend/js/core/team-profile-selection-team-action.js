export function applyManagedTeamSelection(deps) {
    const {
        teamId,
        alignProfile = true,
        resolveManagedTeamId,
        setSelectedTeamId,
        renderProfileSelectOptions,
        getSelectedProfileId,
        getProfileById,
        getBootstrapData
    } = deps;

    const nextTeamId = resolveManagedTeamId(teamId);
    if (!nextTeamId) {
        return;
    }
    setSelectedTeamId(nextTeamId);

    if (!alignProfile) {
        renderProfileSelectOptions(getSelectedProfileId());
        return;
    }

    const currentProfile = getProfileById(getSelectedProfileId());
    if (currentProfile?.team_id === nextTeamId) {
        renderProfileSelectOptions(getSelectedProfileId());
        return;
    }

    const firstProfileInTeam = (getBootstrapData()?.profiles || []).find(profile => profile.team_id === nextTeamId);
    renderProfileSelectOptions(firstProfileInTeam?.id || getSelectedProfileId());
}
