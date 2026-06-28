export function createRuntimeModelPreferenceDraftActions(deps) {
    const {
        getDom,
        getLatestRoleDraft,
        setLatestRoleDraft,
        getSelectedRoleRuntimeModel,
        setSelectedRoleRuntimeModel,
        normalizeRoleDraft,
        defaultSharedNotebook,
        roleRuntimeStorageKey,
        renderRoleStudio
    } = deps;

    function applyRuntimeModelPreferenceToDraft(draft) {
        const selectedRoleRuntimeModel = getSelectedRoleRuntimeModel();
        if (!draft) {
            return draft;
        }
        if (String(draft.model || '').trim()) {
            return draft;
        }
        if (!String(selectedRoleRuntimeModel || '').trim()) {
            return draft;
        }
        return {
            ...draft,
            model: selectedRoleRuntimeModel
        };
    }

    function applyRuntimeModelToDraft(model, { persistPreference = true } = {}) {
        const normalizedModel = String(model || '').trim();
        const dom = getDom();

        if (persistPreference) {
            setSelectedRoleRuntimeModel(normalizedModel);
            localStorage.setItem(roleRuntimeStorageKey, normalizedModel);
        }

        const modelInput = dom.ephemeralRoleForm.querySelector('#role-form-model');
        modelInput.value = normalizedModel;

        const latestRoleDraft = getLatestRoleDraft();
        if (latestRoleDraft) {
            setLatestRoleDraft(normalizeRoleDraft({
                ...latestRoleDraft,
                model: normalizedModel
            }, latestRoleDraft.description || latestRoleDraft.name || '', {
                defaultSharedNotebook
            }));
        }

        renderRoleStudio();
    }

    return {
        applyRuntimeModelPreferenceToDraft,
        applyRuntimeModelToDraft
    };
}
