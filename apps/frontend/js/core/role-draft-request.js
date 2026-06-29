function summarizeErrorMessage(error) {
    return String(error?.message || error || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 260);
}

function classifyDraftFallbackError(error) {
    const message = summarizeErrorMessage(error);
    if (/GROUPCHAT_LLM_BASE_URL/.test(message)) {
        return {
            reason: 'llm_backend_unconfigured',
            message
        };
    }
    if (/timeout|timed out|超时/i.test(message)) {
        return {
            reason: 'llm_backend_timeout',
            message
        };
    }
    return {
        reason: 'llm_backend_error',
        message
    };
}

export async function generateRoleDraftFromIdea(deps) {
    const {
        idea,
        getConfig,
        getActiveSession,
        getManagedProfileId,
        getSelectedRoleStudioModel,
        getSelectedRoleStudioEngine,
        getSelectedRoleStudioReferenceIds,
        fetchJson,
        applyRuntimeModelPreferenceToDraft,
        normalizeRoleDraft,
        normalizeRoleDraftMeta,
        buildRoleDraftFromIdea
    } = deps;

    try {
        const activeSession = getActiveSession();
        const selectedRoleStudioModel = getSelectedRoleStudioModel();
        const selectedReferenceIds = getSelectedRoleStudioReferenceIds();
        const referenceItemIds = selectedReferenceIds instanceof Set
            ? [...selectedReferenceIds]
            : Array.isArray(selectedReferenceIds)
                ? selectedReferenceIds
                : [];
        const config = getConfig();
        const result = await fetchJson('/api/role-studio/draft', {
            method: 'POST',
            body: {
                idea,
                session_id: activeSession?.id || null,
                profile_id: getManagedProfileId(),
                preferred_model: selectedRoleStudioModel || null,
                engine: getSelectedRoleStudioEngine?.() || 'hybrid',
                reference_item_ids: referenceItemIds
            },
            timeoutSeconds: Math.max(config.ApiTimeout || 120, 180)
        });
        return {
            draft: applyRuntimeModelPreferenceToDraft(normalizeRoleDraft(result?.draft, idea)),
            draftMeta: normalizeRoleDraftMeta(result?.meta),
            usedFallback: false
        };
    } catch (error) {
        console.error(error);
        const fallbackError = classifyDraftFallbackError(error);
        return {
            draft: applyRuntimeModelPreferenceToDraft(buildRoleDraftFromIdea(idea)),
            draftMeta: normalizeRoleDraftMeta({
                source: 'fallback',
                model: 'local-heuristic',
                requested_model: getSelectedRoleStudioModel() || null,
                engine: getSelectedRoleStudioEngine?.() || 'hybrid',
                fallback_reason: fallbackError.reason,
                fallback_message: fallbackError.message
            }),
            usedFallback: true
        };
    }
}
