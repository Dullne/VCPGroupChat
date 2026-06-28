import {
    applyLocaleToDocument,
    initializeLocale,
    installLocalizedDialogs,
    syncLocalizedDom
} from './i18n.js';

export function createBootstrapInitializeAction(deps) {
    const {
        getDom,
        getSessions,
        bindUi,
        loadMutedRoleNames,
        applyDarkMode,
        darkModeStorageKey,
        refreshBootstrap,
        refreshImportSources,
        refreshSessionsList,
        switchSession,
        createSession,
        renderAll,
        configureMarked,
        loadConfig,
        startSessionEventSync
    } = deps;

    return async function initialize() {
        const dom = getDom();
        configureMarked();
        initializeLocale();
        installLocalizedDialogs();
        applyLocaleToDocument();
        await loadConfig();
        loadMutedRoleNames();
        applyDarkMode(localStorage.getItem(darkModeStorageKey) === 'true');

        bindUi();
        syncLocalizedDom();
        await refreshBootstrap();
        await refreshImportSources();
        await refreshSessionsList();

        const sessions = getSessions();
        if (sessions.length > 0) {
            await switchSession(dom.sessionSelect.value || sessions[0].id);
        } else {
            await createSession();
            renderAll();
        }

        startSessionEventSync?.();
    };
}
