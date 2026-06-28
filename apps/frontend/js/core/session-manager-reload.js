export function createSessionReloadAction(deps) {
    const {
        getBootstrapData,
        getActiveSession,
        setActiveSession,
        setAvailableRoles,
        setMemoryReflection,
        setMemoryCandidates,
        clearMemoryReflectionState,
        fetchJson,
        clearLatestSelectionTrace,
        pruneSelectedRoles
    } = deps;

    return async function reloadActiveSessionAndRoles() {
        const activeSession = getActiveSession();
        const bootstrapData = getBootstrapData();
        if (!activeSession?.id) {
            setAvailableRoles(bootstrapData?.roles || []);
            clearMemoryReflectionState?.();
            clearLatestSelectionTrace();
            return;
        }

        const [sessionData, rolesData] = await Promise.all([
            fetchJson(`/api/group-chat/sessions/${encodeURIComponent(activeSession.id)}`),
            fetchJson(`/api/roles?session_id=${encodeURIComponent(activeSession.id)}`)
        ]);

        setActiveSession({
            ...sessionData.session,
            round_syntheses: Array.isArray(sessionData.round_syntheses) ? sessionData.round_syntheses : []
        });
        setMemoryReflection?.(sessionData.reflection || null);
        setMemoryCandidates?.(Array.isArray(sessionData.memory_candidates) ? sessionData.memory_candidates : []);
        setAvailableRoles(rolesData.roles || []);
        pruneSelectedRoles();
    };
}
