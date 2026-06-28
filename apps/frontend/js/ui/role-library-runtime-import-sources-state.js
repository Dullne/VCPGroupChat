const COLLAPSE_STATE_KEY = 'collapsedImportSources';

export function readCollapsedImportSourcesState() {
    return JSON.parse(localStorage.getItem(COLLAPSE_STATE_KEY) || '{}');
}

export function updateCollapsedImportSourceState(sourceId, isCollapsed) {
    const states = readCollapsedImportSourcesState();
    states[sourceId] = isCollapsed;
    localStorage.setItem(COLLAPSE_STATE_KEY, JSON.stringify(states));
}
