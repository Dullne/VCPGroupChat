export function readWorkspaceProfileSaveFormValues(deps) {
    const {
        formData,
        readGroupProfileModeOptionsFromForm
    } = deps;

    const name = String(formData.get('name') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const mode = String(formData.get('mode') || 'sequential').trim().toLowerCase();
    const invitePrompt = String(formData.get('invite_prompt') || '').trim();
    const modeOptions = readGroupProfileModeOptionsFromForm(mode);
    const groupPrompt = String(formData.get('group_prompt') || '').trim();

    return {
        name,
        description,
        mode,
        invitePrompt,
        modeOptions,
        groupPrompt
    };
}
