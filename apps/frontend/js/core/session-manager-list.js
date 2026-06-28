import { createSessionListRenderer } from './session-list-renderer.js';
import { createSessionListRefreshAction } from './session-list-refresh-action.js';

export function createSessionListManager(deps) {
    const renderSessionsList = createSessionListRenderer({
        getDom: deps.getDom,
        getBootstrapData: deps.getBootstrapData,
        getTeams: deps.getTeams,
        getSessions: deps.getSessions,
        getActiveSession: deps.getActiveSession,
        setActiveSession: deps.setActiveSession,
        formatDateTime: deps.formatDateTime,
        clearLatestSelectionTrace: deps.clearLatestSelectionTrace,
        switchSession: deps.switchSession
    });
    const refreshSessionsList = createSessionListRefreshAction({
        fetchJson: deps.fetchJson,
        setSessions: deps.setSessions,
        renderSessionsList
    });

    return {
        refreshSessionsList
    };
}
