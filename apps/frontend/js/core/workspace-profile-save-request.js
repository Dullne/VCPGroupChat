export function requestWorkspaceProfileSave(deps) {
    const {
        fetchJson,
        profileId,
        managedTeamId,
        values
    } = deps;

    return fetchJson(`/api/group-profiles/${encodeURIComponent(profileId)}`, {
        method: 'PATCH',
        body: {
            team_id: managedTeamId,
            name: values.name,
            description: values.description,
            mode: values.mode,
            invite_prompt: values.invitePrompt,
            mode_options: values.modeOptions,
            group_prompt: values.groupPrompt
        }
    });
}
