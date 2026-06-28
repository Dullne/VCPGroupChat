export function createRuntimeModelOptionReaders(deps) {
    const {
        getBootstrapData,
        getAvailableRoles,
        getDom,
        getLatestRoleDraft,
        getSelectedRoleRuntimeModel,
        getRoleStudioModelsFromBootstrap,
        getRoleRuntimeModelFromRole,
        getRuntimeModelCandidatesFromData
    } = deps;

    function getRoleStudioModels() {
        return getRoleStudioModelsFromBootstrap(getBootstrapData());
    }

    function getRoleRuntimeModel(role) {
        return getRoleRuntimeModelFromRole(role);
    }

    function getRuntimeModelCandidates(currentValue = '') {
        const models = getRuntimeModelCandidatesFromData({
            bootstrapData: getBootstrapData(),
            availableRoles: getAvailableRoles()
        });
        const normalizedCurrentValue = String(currentValue || '').trim();
        if (normalizedCurrentValue && !models.includes(normalizedCurrentValue)) {
            models.push(normalizedCurrentValue);
        }
        return models;
    }

    function getCurrentDraftRuntimeModelValue() {
        const dom = getDom();
        const latestRoleDraft = getLatestRoleDraft();
        const selectedRoleRuntimeModel = getSelectedRoleRuntimeModel();
        const currentFormModel = dom?.ephemeralRoleForm?.querySelector('#role-form-model')?.value;
        return String(currentFormModel || latestRoleDraft?.model || selectedRoleRuntimeModel || '').trim();
    }

    return {
        getRoleStudioModels,
        getRoleRuntimeModel,
        getRuntimeModelCandidates,
        getCurrentDraftRuntimeModelValue
    };
}
