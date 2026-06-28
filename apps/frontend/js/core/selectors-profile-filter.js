export function filterProfilesByTeamAndKeyword(deps) {
    const {
        profiles,
        managedTeamId,
        profileFilterKeyword
    } = deps;

    const teamFiltered = profiles.filter(profile => {
        if (!managedTeamId) {
            return true;
        }
        return String(profile.team_id || '') === managedTeamId;
    });

    if (!profileFilterKeyword) {
        return teamFiltered;
    }

    return teamFiltered.filter(profile => {
        const memberNames = (profile.members || []).map(member => member.role_name || member.role_id).join(' ');
        const haystack = [
            profile.id,
            profile.name,
            profile.description,
            profile.group_prompt,
            memberNames
        ].join(' ').toLowerCase();

        return haystack.includes(profileFilterKeyword);
    });
}
