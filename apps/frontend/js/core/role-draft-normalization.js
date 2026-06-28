import { buildRoleDraftFromIdea } from './role-draft-idea.js';
import {
    normalizeDraftNotebookName,
    isUsableRoleDraftTemplate,
    normalizeRoleDraftResponsibilities
} from './role-draft-normalization-utils.js';

export function normalizeRoleDraft(draft, idea = '', options = {}) {
    const defaultSharedNotebook = options.defaultSharedNotebook || '公共';
    const fallback = buildRoleDraftFromIdea(idea || draft?.description || '');
    const responsibilities = normalizeRoleDraftResponsibilities(draft?.responsibilities, fallback.responsibilities);

    return {
        ...fallback,
        ...draft,
        name: String(draft?.name || fallback.name || '').trim() || fallback.name,
        privateNotebook: normalizeDraftNotebookName(
            draft?.privateNotebook || draft?.private_notebook,
            fallback.privateNotebook,
            defaultSharedNotebook
        ),
        knowledgeNotebook: normalizeDraftNotebookName(
            draft?.knowledgeNotebook || draft?.knowledge_notebook,
            fallback.knowledgeNotebook,
            defaultSharedNotebook
        ),
        description: String(draft?.description || fallback.description || '').trim() || fallback.description,
        persona: String(draft?.persona || fallback.persona || '').trim() || fallback.persona,
        template: isUsableRoleDraftTemplate(draft?.template || draft?.template_content)
            ? String(draft?.template || draft?.template_content || '').trim()
            : fallback.template,
        collaborationGuide: String(draft?.collaborationGuide || draft?.collaboration_guide || fallback.collaborationGuide || '').trim() || fallback.collaborationGuide,
        voiceStyle: String(draft?.voiceStyle || draft?.voice_style || fallback.voiceStyle || '').trim(),
        invitePrompt: String(draft?.invitePrompt || draft?.invite_prompt || fallback.invitePrompt || '').trim() || fallback.invitePrompt,
        model: String(draft?.model || fallback.model || '').trim(),
        responsibilities
    };
}

export function hasMeaningfulRoleDraft(draft) {
    if (!draft) {
        return false;
    }

    return [
        draft.name,
        draft.description,
        draft.persona,
        draft.template,
        ...(draft.responsibilities || [])
    ].some(value => String(value || '').trim());
}
