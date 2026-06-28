import { createGroupProfileFromFormAction } from './workspace-profile-create-form-action.js';
import { createWorkspaceProfileDuplicateSessionActions } from './workspace-profile-duplicate-session-actions.js';

export function createWorkspaceProfileCreateSessionActions(deps) {
    const createGroupProfileFromForm = createGroupProfileFromFormAction({
        getDom: deps.getDom,
        fetchJson: deps.fetchJson,
        showToast: deps.showToast,
        getManagedTeam: deps.getManagedTeam,
        getManagedProfile: deps.getManagedProfile,
        setGroupProfileFormLoadedProfileId: deps.setGroupProfileFormLoadedProfileId,
        readGroupProfileModeOptionsFromForm: deps.readGroupProfileModeOptionsFromForm,
        applyGroupProfileModeOptionsToForm: deps.applyGroupProfileModeOptionsToForm,
        renderGroupProfileModeOptions: deps.renderGroupProfileModeOptions,
        refreshBootstrap: deps.refreshBootstrap,
        setManagedProfile: deps.setManagedProfile,
        createSession: deps.createSession,
        toggleRoleManager: deps.toggleRoleManager,
        renderAll: deps.renderAll,
        getWorkspaceMode: deps.getWorkspaceMode,
        getLauncherSelectedRoleIds: deps.getLauncherSelectedRoleIds,
        clearLauncherSelectedRoleIds: deps.clearLauncherSelectedRoleIds,
        getBootstrapData: deps.getBootstrapData,
        isRoleInManagedTeam: deps.isRoleInManagedTeam
    });
    const {
        duplicateManagedProfile,
        startSessionWithManagedProfile
    } = createWorkspaceProfileDuplicateSessionActions({
        fetchJson: deps.fetchJson,
        showToast: deps.showToast,
        getManagedProfile: deps.getManagedProfile,
        getManagedTeamId: deps.getManagedTeamId,
        getProfileById: deps.getProfileById,
        refreshBootstrap: deps.refreshBootstrap,
        setManagedProfile: deps.setManagedProfile,
        loadManagedProfileIntoForm: deps.loadManagedProfileIntoForm,
        renderAll: deps.renderAll,
        createSession: deps.createSession
    });

    return {
        createGroupProfileFromForm,
        duplicateManagedProfile,
        startSessionWithManagedProfile
    };
}
