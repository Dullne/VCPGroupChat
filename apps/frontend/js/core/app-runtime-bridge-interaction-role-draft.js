export function createRuntimeInteractionRoleDraftBridges(deps) {
    const {
        runtime,
        buildRoleDraftFromIdeaModule,
        normalizeRoleDraftModule,
        normalizeRoleDraftMetaModule,
        describeRoleDraftGenerationModule,
        buildRoleDraftMetaLabelsModule,
        hasMeaningfulRoleDraftModule,
        defaultSharedNotebook
    } = deps;

    const draftRoleIdeaIntoForm = (...args) => runtime.roleDraftActions.draftRoleIdeaIntoForm(...args);
    const clearRoleIdeaDraft = (...args) => runtime.roleDraftFormManager.clearRoleIdeaDraft(...args);
    const buildRoleDraftFromIdea = idea => buildRoleDraftFromIdeaModule(idea);
    const normalizeRoleDraft = (draft, idea = '') => normalizeRoleDraftModule(draft, idea, { defaultSharedNotebook });
    const normalizeRoleDraftMeta = meta => normalizeRoleDraftMetaModule(meta);
    const describeRoleDraftGeneration = meta => describeRoleDraftGenerationModule(meta);
    const buildRoleDraftMetaLabels = meta => buildRoleDraftMetaLabelsModule(meta);
    const applyRoleDraftToForm = draft => runtime.roleDraftFormManager.applyRoleDraftToForm(draft);
    const hasMeaningfulRoleDraft = draft => hasMeaningfulRoleDraftModule(draft);
    const syncRoleDraftFromForm = (...args) => runtime.roleDraftFormManager.syncRoleDraftFromForm(...args);
    const createEphemeralRole = (...args) => runtime.ephemeralRoleActions.createEphemeralRole(...args);
    const saveRoleDraft = (...args) => runtime.roleStudioActions.saveRoleDraft(...args);
    const promoteEphemeralRole = ephemeralRoleId => runtime.ephemeralRoleActions.promoteEphemeralRole(ephemeralRoleId);
    const deleteEphemeralRole = ephemeralRoleId => runtime.ephemeralRoleActions.deleteEphemeralRole(ephemeralRoleId);
    const refreshRoleStudioSources = (...args) => runtime.roleStudioSourceRuntime.refreshRoleStudioSources(...args);
    const syncRoleStudioSourcePreferences = (...args) => runtime.roleStudioSourceRuntime.syncRoleStudioSourcePreferences(...args);
    const renderRoleStudioSources = (...args) => runtime.roleStudioSourceRuntime.renderRoleStudioSources(...args);
    const selectRoleStudioEngine = (...args) => runtime.roleStudioSourceRuntime.selectRoleStudioEngine(...args);
    const toggleRoleStudioReference = (...args) => runtime.roleStudioSourceRuntime.toggleRoleStudioReference(...args);
    const searchRoleStudioReferences = (...args) => runtime.roleStudioSourceRuntime.searchRoleStudioReferences(...args);

    return {
        draftRoleIdeaIntoForm,
        clearRoleIdeaDraft,
        buildRoleDraftFromIdea,
        normalizeRoleDraft,
        normalizeRoleDraftMeta,
        describeRoleDraftGeneration,
        buildRoleDraftMetaLabels,
        applyRoleDraftToForm,
        hasMeaningfulRoleDraft,
        syncRoleDraftFromForm,
        createEphemeralRole,
        saveRoleDraft,
        promoteEphemeralRole,
        deleteEphemeralRole,
        refreshRoleStudioSources,
        syncRoleStudioSourcePreferences,
        renderRoleStudioSources,
        selectRoleStudioEngine,
        toggleRoleStudioReference,
        searchRoleStudioReferences
    };
}
