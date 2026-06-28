const GROUP_PROFILE_PATCH_FIELDS = [
    'team_id',
    'teamId',
    'name',
    'description',
    'mode',
    'invite_prompt',
    'invitePrompt',
    'mode_options',
    'modeOptions',
    'group_prompt',
    'groupPrompt'
];

function buildGroupProfilePatchPayload(body = {}) {
    const source = body && typeof body === 'object' ? body : {};
    const payload = {};

    for (const field of GROUP_PROFILE_PATCH_FIELDS) {
        if (
            Object.prototype.hasOwnProperty.call(source, field)
            && source[field] !== undefined
        ) {
            payload[field] = source[field];
        }
    }

    return payload;
}

module.exports = {
    buildGroupProfilePatchPayload
};
