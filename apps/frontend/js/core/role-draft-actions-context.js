export function buildRoleDraftGenerationContext(deps) {
    const {
        idea,
        getConfig,
        getActiveSession,
        getManagedProfileId,
        getSelectedRoleStudioContextMode,
        getSelectedRoleStudioModel,
        getSelectedRoleStudioEngine,
        getSelectedRoleStudioReferenceIds,
        fetchJson,
        applyRuntimeModelPreferenceToDraft,
        normalizeRoleDraft,
        normalizeRoleDraftMeta,
        buildRoleDraftFromIdea
    } = deps;

    return {
        idea,
        getConfig,
        getActiveSession,
        getManagedProfileId,
        getSelectedRoleStudioContextMode,
        getSelectedRoleStudioModel,
        getSelectedRoleStudioEngine,
        getSelectedRoleStudioReferenceIds,
        fetchJson,
        applyRuntimeModelPreferenceToDraft,
        normalizeRoleDraft,
        normalizeRoleDraftMeta,
        buildRoleDraftFromIdea
    };
}
