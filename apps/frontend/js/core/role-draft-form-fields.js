export function applyRoleDraftToEphemeralForm(deps) {
    const {
        getDom,
        draft,
        renderRuntimeModelOptions
    } = deps;

    if (!draft) {
        return;
    }

    const dom = getDom();
    dom.ephemeralRoleForm.querySelector('#role-form-name').value = draft.name || '';
    dom.ephemeralRoleForm.querySelector('#role-form-memory').value = draft.privateNotebook || '';
    dom.ephemeralRoleForm.querySelector('#role-form-knowledge').value = draft.knowledgeNotebook || '';
    dom.ephemeralRoleForm.querySelector('#role-form-model').value = draft.model || '';
    dom.ephemeralRoleForm.querySelector('#role-form-description').value = draft.description || '';
    dom.ephemeralRoleForm.querySelector('#role-form-persona').value = draft.persona || '';
    dom.ephemeralRoleForm.querySelector('#role-form-responsibilities').value = (draft.responsibilities || []).join('\n');
    dom.ephemeralRoleForm.querySelector('#role-form-template').value = draft.template || '';
    renderRuntimeModelOptions();
}

export function readRoleDraftFromEphemeralForm(deps) {
    const {
        getDom,
        latestRoleDraft
    } = deps;

    const dom = getDom();
    const formData = new FormData(dom.ephemeralRoleForm);
    const name = String(formData.get('name') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const persona = String(formData.get('persona') || '').trim();
    const template = String(formData.get('template') || '').trim();
    const privateNotebook = String(formData.get('privateNotebook') || '').trim() || name;
    const knowledgeNotebook = String(formData.get('knowledgeNotebook') || '').trim() || (name ? `${name}的知识` : '');
    const responsibilities = String(formData.get('responsibilities') || '')
        .split('\n')
        .map(item => item.trim())
        .filter(Boolean);

    return {
        name,
        description,
        persona,
        responsibilities,
        template,
        privateNotebook,
        knowledgeNotebook,
        model: String(formData.get('model') || '').trim(),
        invitePrompt: latestRoleDraft?.invitePrompt || '',
        collaborationGuide: latestRoleDraft?.collaborationGuide || '',
        voiceStyle: latestRoleDraft?.voiceStyle || ''
    };
}
