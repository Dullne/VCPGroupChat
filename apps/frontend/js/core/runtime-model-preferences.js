import { createRuntimeModelPreferenceSyncActions } from './runtime-model-preference-sync.js';
import { createRuntimeModelPreferenceDraftActions } from './runtime-model-preference-draft.js';

export function createRuntimeModelPreferenceHelpers(deps) {
    const {
        syncRoleStudioModelPreference,
        syncRoleRuntimeModelPreference
    } = createRuntimeModelPreferenceSyncActions({
        getRoleStudioModels: deps.getRoleStudioModels,
        getRuntimeModelCandidates: deps.getRuntimeModelCandidates,
        getSelectedRoleStudioModel: deps.getSelectedRoleStudioModel,
        setSelectedRoleStudioModel: deps.setSelectedRoleStudioModel,
        getSelectedRoleRuntimeModel: deps.getSelectedRoleRuntimeModel,
        setSelectedRoleRuntimeModel: deps.setSelectedRoleRuntimeModel,
        roleStudioStorageKey: deps.roleStudioStorageKey,
        roleRuntimeStorageKey: deps.roleRuntimeStorageKey
    });
    const {
        applyRuntimeModelPreferenceToDraft,
        applyRuntimeModelToDraft
    } = createRuntimeModelPreferenceDraftActions({
        getDom: deps.getDom,
        getLatestRoleDraft: deps.getLatestRoleDraft,
        setLatestRoleDraft: deps.setLatestRoleDraft,
        getSelectedRoleRuntimeModel: deps.getSelectedRoleRuntimeModel,
        setSelectedRoleRuntimeModel: deps.setSelectedRoleRuntimeModel,
        normalizeRoleDraft: deps.normalizeRoleDraft,
        defaultSharedNotebook: deps.defaultSharedNotebook,
        roleRuntimeStorageKey: deps.roleRuntimeStorageKey,
        renderRoleStudio: deps.renderRoleStudio
    });

    return {
        syncRoleStudioModelPreference,
        syncRoleRuntimeModelPreference,
        applyRuntimeModelPreferenceToDraft,
        applyRuntimeModelToDraft
    };
}
