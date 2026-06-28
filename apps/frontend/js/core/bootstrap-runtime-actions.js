import { createBootstrapRefreshActions } from './bootstrap-refresh-actions.js';
import { createBootstrapWorkspaceActions } from './bootstrap-workspace-actions.js';
import { createBootstrapInitializeAction } from './bootstrap-initialize-action.js';

export function createBootstrapRuntimeActions(deps) {
    const {
        refreshBootstrap,
        refreshImportSources
    } = createBootstrapRefreshActions(deps);
    const { openWorkspace } = createBootstrapWorkspaceActions({
        setWorkspaceMode: deps.setWorkspaceMode,
        toggleRoleManager: deps.toggleRoleManager,
        refreshImportSources,
        refreshRoleStudioSources: deps.refreshRoleStudioSources,
        reloadActiveSessionAndRoles: deps.reloadActiveSessionAndRoles,
        renderRoleManager: deps.renderRoleManager
    });
    const initialize = createBootstrapInitializeAction({
        getDom: deps.getDom,
        getSessions: deps.getSessions,
        bindUi: deps.bindUi,
        loadMutedRoleNames: deps.loadMutedRoleNames,
        applyDarkMode: deps.applyDarkMode,
        darkModeStorageKey: deps.darkModeStorageKey,
        refreshBootstrap,
        refreshImportSources,
        refreshSessionsList: deps.refreshSessionsList,
        switchSession: deps.switchSession,
        createSession: deps.createSession,
        renderAll: deps.renderAll,
        configureMarked: deps.configureMarked,
        loadConfig: deps.loadConfig,
        startSessionEventSync: deps.startSessionEventSync
    });

    return {
        initialize,
        refreshBootstrap,
        refreshImportSources,
        openWorkspace
    };
}
