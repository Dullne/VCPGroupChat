import { renderEmptySessionSidebar } from './session-list-sidebar-renderer.js';

export function renderEmptySessionsState(deps) {
    const {
        dom,
        setActiveSession,
        clearLatestSelectionTrace
    } = deps;

    const option = document.createElement('option');
    option.value = '';
    option.textContent = '无会话';
    dom.sessionSelect.appendChild(option);
    setActiveSession(null);
    clearLatestSelectionTrace();
    renderEmptySessionSidebar();
}
