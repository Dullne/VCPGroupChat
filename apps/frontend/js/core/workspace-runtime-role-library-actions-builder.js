import { createRoleLibraryActions } from './role-library-actions.js';

export function buildRoleLibraryActionsForRuntime(deps) {
    return createRoleLibraryActions({
        getManagedProfile: deps.getManagedProfile,
        getAvailableRoles: deps.getAvailableRoles,
        getBootstrapData: deps.getBootstrapData,
        getActiveSession: deps.getActiveSession,
        getDom: deps.getDom,
        getManagedTeamId: deps.getManagedTeamId,
        getTeamDraftSelectedRoleIds: deps.getTeamDraftSelectedRoleIds,
        setTeamDraftSelectedRoleIds: deps.setTeamDraftSelectedRoleIds,
        setActiveSession: deps.setActiveSession,
        fetchJson: deps.fetchJson,
        showToast: deps.showToast,
        refreshBootstrap: deps.refreshBootstrap,
        refreshSessionsList: deps.refreshSessionsList,
        reloadActiveSessionAndRoles: deps.reloadActiveSessionAndRoles,
        renderAll: deps.renderAll
    });
}
