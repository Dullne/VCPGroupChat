export function createRuntimeInteractionModelBridges(deps) {
    const { runtime } = deps;

    const syncRoleStudioModelPreference = (...args) => runtime.runtimeModelManager.syncRoleStudioModelPreference(...args);
    const getRoleRuntimeModel = (...args) => runtime.runtimeModelManager.getRoleRuntimeModel(...args);
    const getRuntimeModelCandidates = (currentValue = '') => runtime.runtimeModelManager.getRuntimeModelCandidates(currentValue);
    const syncRoleRuntimeModelPreference = (...args) => runtime.runtimeModelManager.syncRoleRuntimeModelPreference(...args);
    const renderRoleStudioModelOptions = (...args) => runtime.runtimeModelManager.renderRoleStudioModelOptions(...args);
    const renderRuntimeModelOptions = (...args) => runtime.runtimeModelManager.renderRuntimeModelOptions(...args);
    const applyRuntimeModelPreferenceToDraft = draft => runtime.runtimeModelManager.applyRuntimeModelPreferenceToDraft(draft);
    const applyRuntimeModelToDraft = (model, { persistPreference = true } = {}) => runtime.runtimeModelManager.applyRuntimeModelToDraft(model, { persistPreference });

    return {
        syncRoleStudioModelPreference,
        getRoleRuntimeModel,
        getRuntimeModelCandidates,
        syncRoleRuntimeModelPreference,
        renderRoleStudioModelOptions,
        renderRuntimeModelOptions,
        applyRuntimeModelPreferenceToDraft,
        applyRuntimeModelToDraft
    };
}
