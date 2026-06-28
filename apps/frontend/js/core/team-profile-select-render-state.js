export function buildProfilesToRender(deps) {
    const {
        filteredProfiles,
        selectedProfile,
        managedTeamId
    } = deps;

    const profilesToRender = [...filteredProfiles];
    if (
        selectedProfile &&
        !profilesToRender.some(profile => profile.id === selectedProfile.id) &&
        (!managedTeamId || String(selectedProfile.team_id || '') === managedTeamId)
    ) {
        profilesToRender.unshift(selectedProfile);
    }
    return profilesToRender;
}

export function resolveNextProfileValue(deps) {
    const {
        profilesToRender,
        targetProfileId
    } = deps;

    return profilesToRender.some(profile => profile.id === targetProfileId)
        ? targetProfileId
        : profilesToRender[0].id;
}
