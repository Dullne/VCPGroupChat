import { createWorkspaceActions } from './workspace-actions.js';

export function buildWorkspaceActionsForRuntime(deps) {
    return createWorkspaceActions({
        getDom: deps.getDom,
        fetchJson: deps.fetchJson,
        showToast: deps.showToast,
        getManagedTeam: deps.getManagedTeam,
        getManagedProfile: deps.getManagedProfile,
        getManagedTeamId: deps.getManagedTeamId,
        getProfileById: deps.getProfileById,
        setManagedProfile: deps.setManagedProfile,
        getGroupProfileFormLoadedProfileId: deps.getGroupProfileFormLoadedProfileId,
        setGroupProfileFormLoadedProfileId: deps.setGroupProfileFormLoadedProfileId,
        readGroupProfileModeOptionsFromForm: deps.readGroupProfileModeOptionsFromForm,
        applyGroupProfileModeOptionsToForm: deps.applyGroupProfileModeOptionsToForm,
        renderGroupProfileModeOptions: deps.renderGroupProfileModeOptions,
        renderGroupProfileFormStatus: deps.renderGroupProfileFormStatus,
        refreshBootstrap: deps.refreshBootstrap,
        renderAll: deps.renderAll,
        createSession: deps.createSession,
        toggleRoleManager: deps.toggleRoleManager,
        reloadActiveSessionAndRoles: deps.reloadActiveSessionAndRoles,
        getSelectedProfileId: deps.getSelectedProfileId,
        getSelectedTeamId: deps.getSelectedTeamId,
        setSelectedTeamId: deps.setSelectedTeamId,
        setSelectedProfileId: deps.setSelectedProfileId,
        getBootstrapData: deps.getBootstrapData,
        getActiveSession: deps.getActiveSession,
        getWorkspaceMode: deps.getWorkspaceMode,
        getLauncherSelectedRoleIds: deps.getLauncherSelectedRoleIds,
        clearLauncherSelectedRoleIds: deps.clearLauncherSelectedRoleIds,
        isRoleInManagedTeam: deps.isRoleInManagedTeam
    });
}
