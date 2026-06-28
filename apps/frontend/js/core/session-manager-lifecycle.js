import { createSessionReloadAction } from './session-manager-reload.js';
import { createSessionSwitchCreateActions } from './session-manager-switch-create.js';

export function createSessionLifecycleManager(deps) {
    const reloadActiveSessionAndRoles = createSessionReloadAction({
        getBootstrapData: deps.getBootstrapData,
        getActiveSession: deps.getActiveSession,
        setActiveSession: deps.setActiveSession,
        setAvailableRoles: deps.setAvailableRoles,
        setMemoryReflection: deps.setMemoryReflection,
        setMemoryCandidates: deps.setMemoryCandidates,
        clearMemoryReflectionState: deps.clearMemoryReflectionState,
        fetchJson: deps.fetchJson,
        clearLatestSelectionTrace: deps.clearLatestSelectionTrace,
        pruneSelectedRoles: deps.pruneSelectedRoles
    });

    const {
        switchSession,
        createSession
    } = createSessionSwitchCreateActions({
        getDom: deps.getDom,
        getBootstrapData: deps.getBootstrapData,
        getActiveSession: deps.getActiveSession,
        setActiveSession: deps.setActiveSession,
        clearLatestSelectionTrace: deps.clearLatestSelectionTrace,
        clearSelectedIncludeRoleIds: deps.clearSelectedIncludeRoleIds,
        clearExcludedRoleNamesForNextRound: deps.clearExcludedRoleNamesForNextRound,
        getProfileById: deps.getProfileById,
        getSelectedProfileId: deps.getSelectedProfileId,
        setSelectedProfileId: deps.setSelectedProfileId,
        resolveManagedTeamId: deps.resolveManagedTeamId,
        setSelectedTeamId: deps.setSelectedTeamId,
        renderProfileSelectOptions: deps.renderProfileSelectOptions,
        refreshBootstrap: deps.refreshBootstrap,
        renderAll: deps.renderAll,
        refreshSessionsList: deps.refreshSessionsList,
        fetchJson: deps.fetchJson,
        reloadActiveSessionAndRoles
    });

    return {
        reloadActiveSessionAndRoles,
        switchSession,
        createSession
    };
}
