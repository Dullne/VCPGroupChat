import { renderSessionSelectOptions } from './session-list-select-options.js';
import { renderSessionSidebarList } from './session-list-sidebar-renderer.js';
import { renderEmptySessionsState } from './session-list-empty-state.js';

export function createSessionListRenderer(deps) {
    const {
        getDom,
        getBootstrapData,
        getTeams,
        getSessions,
        getActiveSession,
        setActiveSession,
        formatDateTime,
        clearLatestSelectionTrace,
        switchSession
    } = deps;

    return function renderSessionsList() {
        const dom = getDom();
        const bootstrapData = getBootstrapData();
        const sessions = getSessions();
        dom.sessionSelect.innerHTML = '';

        if (!sessions.length) {
            renderEmptySessionsState({
                dom,
                setActiveSession,
                clearLatestSelectionTrace
            });
            return;
        }

        renderSessionSelectOptions({
            dom,
            sessions,
            bootstrapData,
            teams: getTeams(),
            formatDateTime
        });

        const activeSession = getActiveSession();
        const nextSessionId = activeSession?.id || sessions[0].id;
        dom.sessionSelect.value = nextSessionId;

        renderSessionSidebarList({
            sessions,
            activeSessionId: activeSession?.id,
            formatDateTime,
            switchSession
        });
    };
}
