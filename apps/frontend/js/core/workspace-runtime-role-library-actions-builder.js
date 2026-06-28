import { createRoleLibraryActions } from './role-library-actions.js';

export function buildRoleLibraryActionsForRuntime(deps) {
    return createRoleLibraryActions({
        getManagedProfile: deps.getManagedProfile,
        getAvailableRoles: deps.getAvailableRoles,
        getBootstrapData: deps.getBootstrapData,
        getActiveSession: deps.getActiveSession,
        getDom: deps.getDom,
        getManagedTeamId: deps.getManagedTeamId,
        getCatalogItem: deps.getCatalogItem,
        setActiveSession: deps.setActiveSession,
        fetchJson: deps.fetchJson,
        showToast: deps.showToast,
        refreshBootstrap: deps.refreshBootstrap,
        refreshImportSources: deps.refreshImportSources,
        refreshSessionsList: deps.refreshSessionsList,
        reloadActiveSessionAndRoles: deps.reloadActiveSessionAndRoles,
        renderAll: deps.renderAll
    });
}
