export function buildGroupProfileCreatePayload(deps) {
    const {
        name,
        managedTeamId,
        description,
        mode,
        invitePrompt,
        modeOptions,
        groupPrompt,
        cloneCurrentProfile,
        currentProfileId,
        members = []
    } = deps;

    return {
        name,
        team_id: managedTeamId,
        description,
        mode,
        invite_prompt: invitePrompt,
        mode_options: modeOptions,
        ...(groupPrompt ? { group_prompt: groupPrompt } : {}),
        ...(cloneCurrentProfile && currentProfileId && members.length === 0 ? { clone_from_profile_id: currentProfileId } : {}),
        ...(members.length > 0 ? { members } : {})
    };
}
