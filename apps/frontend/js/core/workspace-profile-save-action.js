import { prepareWorkspaceProfileSaveInput } from './workspace-profile-save-action-prepare.js';
import { requestWorkspaceProfileSave } from './workspace-profile-save-request.js';
import { handleWorkspaceProfileSaved } from './workspace-profile-save-post.js';

export function createWorkspaceProfileSaveAction(deps) {
    const {
        getDom,
        fetchJson,
        showToast,
        getManagedProfile,
        getManagedTeamId,
        getProfileById,
        getGroupProfileFormLoadedProfileId,
        setGroupProfileFormLoadedProfileId,
        readGroupProfileModeOptionsFromForm,
        refreshBootstrap,
        renderAll,
        reloadActiveSessionAndRoles,
        getActiveSession
    } = deps;

    return async function saveManagedProfileFromForm() {
        const saveInput = prepareWorkspaceProfileSaveInput({
            getDom,
            getManagedProfile,
            getGroupProfileFormLoadedProfileId,
            getProfileById,
            showToast,
            readGroupProfileModeOptionsFromForm
        });
        if (!saveInput) {
            return;
        }
        const { profile, values } = saveInput;

        const updated = await requestWorkspaceProfileSave({
            fetchJson,
            profileId: profile.id,
            managedTeamId: getManagedTeamId(),
            values
        });

        await handleWorkspaceProfileSaved({
            updatedProfile: updated.profile,
            refreshBootstrap,
            getActiveSession,
            reloadActiveSessionAndRoles,
            setGroupProfileFormLoadedProfileId,
            renderAll,
            showToast
        });
    };
}
