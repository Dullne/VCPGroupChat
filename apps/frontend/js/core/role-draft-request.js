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
        return {
            draft: applyRuntimeModelPreferenceToDraft(buildRoleDraftFromIdea(idea)),
            draftMeta: normalizeRoleDraftMeta({
                source: 'fallback',
                model: 'local-heuristic',
                requested_model: getSelectedRoleStudioModel() || null,
                engine: getSelectedRoleStudioEngine?.() || 'hybrid'
            }),
            usedFallback: true
        };
    }
}
