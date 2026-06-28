export function buildEphemeralRoleCreatePayload(deps) {
    const {
        formData,
        name,
        latestRoleDraft,
        defaultSharedNotebook
    } = deps;

    const privateNotebook = String(formData.get('privateNotebook') || '').trim() || name;
    const knowledgeNotebook = String(formData.get('knowledgeNotebook') || '').trim() || `${name}的知识`;
    const description = String(formData.get('description') || '').trim();
    const persona = String(formData.get('persona') || '').trim();
    const responsibilities = String(formData.get('responsibilities') || '')
        .split('\n')
        .map(item => item.trim())
        .filter(Boolean);
    const templateContent = String(formData.get('template') || '').trim();
    const model = String(formData.get('model') || '').trim();
    const invitePrompt = String(latestRoleDraft?.invitePrompt || '').trim();
    const collaborationGuide = String(latestRoleDraft?.collaborationGuide || '').trim();
    const voiceStyle = String(latestRoleDraft?.voiceStyle || '').trim();

    return {
        name,
        description,
        persona,
        responsibilities,
        template_content: templateContent || `你是${name}。${description || ''}`.trim(),
        model,
        invite_prompt: invitePrompt || `接下来请作为${name}发言。优先按照你的职责范围回答，不要输出额外聊天标识头。`,
        collaboration_guide: collaborationGuide,
        voice_style: voiceStyle,
        memory: {
            maidName: name,
            privateNotebook,
            knowledgeNotebook,
            sharedNotebooks: [defaultSharedNotebook],
            privateWritebackMaid: `[${privateNotebook}]${name}`,
            sharedWritebackMaid: `[${defaultSharedNotebook}]${name}`
        }
    };
}
