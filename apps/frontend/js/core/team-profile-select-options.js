export function buildProfileOptionGroups(deps) {
    const {
        profilesToRender,
        teams,
        formatProfileOptionLabel
    } = deps;

    const teamMap = new Map(teams.map(team => [team.id, team]));
    const grouped = new Map();
    for (const profile of profilesToRender) {
        const key = profile.team_id || '_no_team';
        const bucket = grouped.get(key) || [];
        bucket.push(profile);
        grouped.set(key, bucket);
    }

    return [...grouped.entries()].map(([teamId, items]) => {
        const team = teamMap.get(teamId);
        const label = team
            ? `${team.name} · ${items.length} 套模板`
            : `未归属团队 · ${items.length} 套模板`;
        const options = items.map(profile => ({
            value: profile.id,
            text: formatProfileOptionLabel(profile)
        }));
        return { label, options };
    });
}

export function resolveTargetProfileId(deps) {
    const {
        preferredProfileId,
        getSelectedProfileId,
        getActiveSession,
        bootstrapData
    } = deps;

    return (
        preferredProfileId ||
        getSelectedProfileId() ||
        getActiveSession()?.profile_id ||
        bootstrapData?.default_profile_id ||
        ''
    );
}
