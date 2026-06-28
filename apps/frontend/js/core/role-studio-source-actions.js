const DEFAULT_ROLE_STUDIO_ENGINE = 'hybrid';
const MAX_SELECTED_REFERENCES = 6;

function normalizeSelectedIds(value) {
    if (value instanceof Set) {
        return new Set([...value].map(item => String(item || '').trim()).filter(Boolean));
    }
    if (Array.isArray(value)) {
        return new Set(value.map(item => String(item || '').trim()).filter(Boolean));
    }
    return new Set();
}

function readStoredReferenceIds(storageKey) {
    try {
        const parsed = JSON.parse(localStorage.getItem(storageKey) || '[]');
        return normalizeSelectedIds(parsed);
    } catch (_error) {
        return new Set();
    }
}

function writeStoredReferenceIds(storageKey, selectedIds) {
    localStorage.setItem(storageKey, JSON.stringify([...selectedIds]));
}

export function createRoleStudioSourceActions(deps) {
    const {
        fetchJson,
        getDom,
        getRoleStudioSources,
        setRoleStudioSources,
        getSelectedRoleStudioEngine,
        setSelectedRoleStudioEngine,
        getSelectedRoleStudioReferenceIds,
        setSelectedRoleStudioReferenceIds,
        roleStudioEngineStorageKey,
        roleStudioReferencesStorageKey,
        renderRoleStudioSources,
        showToast
    } = deps;

    function syncRoleStudioSourcePreferences() {
        const sources = getRoleStudioSources();
        const engines = Array.isArray(sources?.engines) ? sources.engines : [];
        const availableEngines = engines.filter(engine => engine.available !== false);
        const storedEngine = String(localStorage.getItem(roleStudioEngineStorageKey) || '').trim();
        const currentEngine = String(getSelectedRoleStudioEngine() || '').trim();
        const candidateEngine = currentEngine || storedEngine || DEFAULT_ROLE_STUDIO_ENGINE;
        const nextEngine = availableEngines.some(engine => engine.id === candidateEngine)
            ? candidateEngine
            : (availableEngines[0]?.id || DEFAULT_ROLE_STUDIO_ENGINE);

        setSelectedRoleStudioEngine(nextEngine);

        const selectedIds = [...readStoredReferenceIds(roleStudioReferencesStorageKey)]
            .slice(0, MAX_SELECTED_REFERENCES);
        setSelectedRoleStudioReferenceIds(new Set(selectedIds));
    }

    async function refreshRoleStudioSources({ query = '' } = {}) {
        const normalizedQuery = String(query || '').trim();
        const params = new URLSearchParams();
        if (normalizedQuery) {
            params.set('q', normalizedQuery);
        }
        params.set('limit', '24');

        const data = await fetchJson(`/api/role-studio/sources?${params.toString()}`);
        setRoleStudioSources(data || null);
        syncRoleStudioSourcePreferences();
        renderRoleStudioSources();
        return data;
    }

    function selectRoleStudioEngine(engineId) {
        const nextEngine = String(engineId || DEFAULT_ROLE_STUDIO_ENGINE).trim() || DEFAULT_ROLE_STUDIO_ENGINE;
        setSelectedRoleStudioEngine(nextEngine);
        localStorage.setItem(roleStudioEngineStorageKey, nextEngine);
        renderRoleStudioSources();
    }

    function toggleRoleStudioReference(referenceId) {
        const selectedIds = normalizeSelectedIds(getSelectedRoleStudioReferenceIds());
        const normalizedId = String(referenceId || '').trim();
        if (!normalizedId) {
            return;
        }

        if (selectedIds.has(normalizedId)) {
            selectedIds.delete(normalizedId);
        } else {
            if (selectedIds.size >= MAX_SELECTED_REFERENCES) {
                showToast(`最多选择 ${MAX_SELECTED_REFERENCES} 个参考模板`, 'warning');
                return;
            }
            selectedIds.add(normalizedId);
        }

        setSelectedRoleStudioReferenceIds(selectedIds);
        writeStoredReferenceIds(roleStudioReferencesStorageKey, selectedIds);
        renderRoleStudioSources();
    }

    async function searchRoleStudioReferences() {
        const dom = getDom();
        await refreshRoleStudioSources({
            query: dom.roleStudioReferenceSearch.value
        });
    }

    return {
        refreshRoleStudioSources,
        syncRoleStudioSourcePreferences,
        selectRoleStudioEngine,
        toggleRoleStudioReference,
        searchRoleStudioReferences
    };
}
