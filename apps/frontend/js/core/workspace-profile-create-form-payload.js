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
        members = [],
        personMembers = []
    } = deps;

    return {
        name,
        team_id: managedTeamId,
        description,
        mode,
        invite_prompt: invitePrompt,
        mode_options: modeOptions,
        ...(groupPrompt ? { group_prompt: groupPrompt } : {}),
        ...(cloneCurrentProfile && currentProfileId && members.length === 0 && personMembers.length === 0 ? { clone_from_profile_id: currentProfileId } : {}),
        ...(personMembers.length > 0 ? { person_members: personMembers } : {}),
        ...(members.length > 0 ? { members } : {})
    };
}
