import {
    applyDarkModeClass,
    loadStringSetFromStorage,
    saveStringSetToStorage
} from './prefs.js';
import { createStateValueAccessors } from './app-state-accessors-values.js';

export function createAppStateAccessors(deps) {
    const { state, darkModeStorageKey, muteStorageKey } = deps;
    const valueAccessors = createStateValueAccessors(state);

    const applyDarkMode = enabled => {
        applyDarkModeClass(enabled, { storageKey: darkModeStorageKey });
        // Keep the toggle icon in sync with state (covers both the click handler
        // and the on-load restore in bootstrap). Moon = "switch to dark", sun =
        // "switch to light".
        const toggle = document.getElementById('dark-mode-toggle');
        if (toggle) {
            toggle.textContent = enabled ? '☀' : '🌙';
        }
    };

    const loadMutedRoleNames = () => {
        state.persistentlyMutedRoleNames = loadStringSetFromStorage(muteStorageKey);
    };

    const saveMutedRoleNames = () => {
        saveStringSetToStorage(muteStorageKey, state.persistentlyMutedRoleNames);
    };

    return {
        ...valueAccessors,
        applyDarkMode,
        loadMutedRoleNames,
        saveMutedRoleNames
    };
}
