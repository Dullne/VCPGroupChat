export function normalizeDraftNotebookName(value, fallback, defaultSharedNotebook) {
    const candidate = String(value || '').replace(/\s+/g, ' ').trim();
    if (!candidate) {
        return fallback;
    }
    if (candidate === defaultSharedNotebook) {
        return fallback;
    }
    if (candidate.length > 18) {
        return fallback;
    }
    if (/[，,、;；/]/.test(candidate)) {
        return fallback;
    }
    return candidate;
}

export function isUsableRoleDraftTemplate(value) {
    const candidate = String(value || '').trim();
    if (!candidate) {
        return false;
    }
    if (candidate.length < 60) {
        return false;
    }
    if (!/[\n：:-]/.test(candidate)) {
        return false;
    }
    return true;
}

export function normalizeRoleDraftResponsibilities(value, fallback) {
    const list = Array.isArray(value)
        ? value
        : fallback;

    const normalized = list
        .map(item => String(item || '').trim())
        .filter(item => item && item.length >= 2 && !/^[\d.\-_*()]+$/.test(item));

    return normalized.length ? [...new Set(normalized)] : fallback;
}
