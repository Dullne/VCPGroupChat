export function applyTeamProfileSelection(deps) {
    const {
        dom,
        nextValue,
        setSelectedProfileId,
        getProfileById,
        setSelectedTeamId,
        resolveManagedTeamId
    } = deps;

    dom.profileSelect.value = nextValue;
    setSelectedProfileId(nextValue || null);
    const selectedProfileForTeam = getProfileById(nextValue);
    if (selectedProfileForTeam?.team_id) {
        setSelectedTeamId(resolveManagedTeamId(selectedProfileForTeam.team_id));
    }
}
