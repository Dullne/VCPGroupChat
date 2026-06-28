export function createRuntimeModelPreferenceSyncActions(deps) {
    const {
        getRoleStudioModels,
        getRuntimeModelCandidates,
        getSelectedRoleStudioModel,
        setSelectedRoleStudioModel,
        getSelectedRoleRuntimeModel,
        setSelectedRoleRuntimeModel,
        roleStudioStorageKey,
        roleRuntimeStorageKey
    } = deps;

    function syncRoleStudioModelPreference() {
        const availableModels = getRoleStudioModels();
        const savedModel = String(localStorage.getItem(roleStudioStorageKey) || '').trim();
        const selectedRoleStudioModel = getSelectedRoleStudioModel();

        if (selectedRoleStudioModel && (availableModels.includes(selectedRoleStudioModel) || !availableModels.length)) {
            return;
        }

        setSelectedRoleStudioModel(availableModels.includes(savedModel) ? savedModel : '');
    }

    function syncRoleRuntimeModelPreference() {
        const availableModels = getRuntimeModelCandidates();
        const savedModel = String(localStorage.getItem(roleRuntimeStorageKey) || '').trim();
        const selectedRoleRuntimeModel = getSelectedRoleRuntimeModel();

        if (selectedRoleRuntimeModel && (availableModels.includes(selectedRoleRuntimeModel) || !availableModels.length)) {
            return;
        }

        setSelectedRoleRuntimeModel(availableModels.includes(savedModel) ? savedModel : '');
    }

    return {
        syncRoleStudioModelPreference,
        syncRoleRuntimeModelPreference
    };
}
