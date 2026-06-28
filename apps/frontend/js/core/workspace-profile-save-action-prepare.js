import { readWorkspaceProfileSaveFormValues } from './workspace-profile-save-form-values.js';
import {
    validateWorkspaceProfileSaveContext,
    validateWorkspaceProfileSaveFormValues
} from './workspace-profile-save-validate.js';

export function prepareWorkspaceProfileSaveInput(deps) {
    const {
        getDom,
        getManagedProfile,
        getGroupProfileFormLoadedProfileId,
        getProfileById,
        showToast,
        readGroupProfileModeOptionsFromForm
    } = deps;

    const profile = getManagedProfile();
    const loadedProfileId = getGroupProfileFormLoadedProfileId();
    if (!validateWorkspaceProfileSaveContext({
        profile,
        loadedProfileId,
        getProfileById,
        showToast
    })) {
        return null;
    }

    const dom = getDom();
    const formData = new FormData(dom.groupProfileForm);
    const values = readWorkspaceProfileSaveFormValues({
        formData,
        readGroupProfileModeOptionsFromForm
    });
    if (!validateWorkspaceProfileSaveFormValues({
        values,
        showToast
    })) {
        return null;
    }

    return {
        profile,
        values
    };
}
