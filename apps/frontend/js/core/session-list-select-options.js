export function renderSessionSelectOptions(deps) {
    const {
        dom,
        sessions,
        bootstrapData,
        teams,
        formatDateTime
    } = deps;

    const profileMap = new Map((bootstrapData?.profiles || []).map(profile => [profile.id, profile]));
    const teamMap = new Map((teams || []).map(team => [team.id, team]));
    const groupedSessions = new Map();

    for (const session of sessions) {
        const bucket = groupedSessions.get(session.profile_id) || [];
        bucket.push(session);
        groupedSessions.set(session.profile_id, bucket);
    }

    for (const [profileId, profileSessions] of groupedSessions.entries()) {
        const profile = profileMap.get(profileId);
        const teamName = profile?.team_id ? (teamMap.get(profile.team_id)?.name || profile.team_id) : '未归属团队';
        const group = document.createElement('optgroup');
        group.label = profile
            ? `${teamName} / ${profile.name} · ${profileSessions.length} 个会话`
            : `未知模板 · ${profileSessions.length} 个会话`;

        for (const session of profileSessions) {
            const option = document.createElement('option');
            option.value = session.id;
            option.textContent = `${session.title} · ${formatDateTime(session.updated_at)}`;
            group.appendChild(option);
        }

        dom.sessionSelect.appendChild(group);
    }
}
