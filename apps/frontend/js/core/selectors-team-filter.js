export function filterTeamsByKeyword(teams, teamFilterKeyword) {
    if (!teamFilterKeyword) {
        return teams;
    }

    return teams.filter(team => {
        const haystack = [
            team.id,
            team.name,
            team.description
        ].join(' ').toLowerCase();
        return haystack.includes(teamFilterKeyword);
    });
}
