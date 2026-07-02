import { buildGroupProfileCreatePayload } from './workspace-profile-create-form-payload.js';

export function requestCreateGroupProfileFromForm(deps) {
    const {
        fetchJson,
        values,
        managedTeamId,
        currentProfileId
    } = deps;

    const {
        name,
        description,
        mode,
        invitePrompt,
        modeOptions,
        groupPrompt,
        cloneCurrentProfile,
        members = [],
        personMembers = []
    } = values;

    return fetchJson('/api/group-profiles', {
        method: 'POST',
        body: buildGroupProfileCreatePayload({
            name,
            managedTeamId,
            description,
            mode,
            invitePrompt,
            modeOptions,
            groupPrompt,
            cloneCurrentProfile,
            currentProfileId,
            members,
            personMembers
        })
    });
}
