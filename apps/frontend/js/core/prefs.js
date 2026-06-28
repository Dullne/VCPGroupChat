export function applyDarkModeClass(enabled, { className = 'night-mode', storageKey = null } = {}) {
    document.body.classList.toggle(className, Boolean(enabled));
    if (storageKey) {
        localStorage.setItem(storageKey, String(Boolean(enabled)));
    }
}

export function loadStringSetFromStorage(storageKey) {
    try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
        return new Set(Array.isArray(saved) ? saved : []);
    } catch (_error) {
        return new Set();
    }
}

export function saveStringSetToStorage(storageKey, values) {
    localStorage.setItem(storageKey, JSON.stringify([...values]));
}

export function loadLocaleFromStorage(storageKey, fallback = 'zh-CN') {
    const value = localStorage.getItem(storageKey);
    return value || fallback;
}

export function saveLocaleToStorage(storageKey, locale) {
    localStorage.setItem(storageKey, locale);
}
