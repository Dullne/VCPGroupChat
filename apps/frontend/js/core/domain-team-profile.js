export function normalizeTeamsFromBootstrap(data) {
    const incomingTeams = Array.isArray(data?.teams)
        ? data.teams
            .map(team => ({
                ...team,
                id: String(team?.id || '').trim(),
                name: String(team?.name || '').trim()
            }))
            .filter(team => team.id && team.name)
        : [];

    if (incomingTeams.length > 0) {
        return incomingTeams;
    }

    const profileTeams = new Map();
    for (const profile of data?.profiles || []) {
        const teamId = String(profile?.team_id || '').trim();
        if (!teamId) {
            continue;
        }
        if (!profileTeams.has(teamId)) {
            profileTeams.set(teamId, {
                id: teamId,
                name: `团队 ${teamId}`,
                description: ''
            });
        }
    }

    if (profileTeams.size > 0) {
        return [...profileTeams.values()];
    }

    return [{
        id: data?.default_team_id || 'team_default',
        name: '默认团队',
        description: ''
    }];
}

export {
    normalizeNatureRandomModeOptions,
    getProfileModeLabel,
    getProfileModeDetail,
    formatProfileOptionLabel
} from './domain-profile-mode.js';
