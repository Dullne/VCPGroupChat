export function createSessionListRefreshAction(deps) {
    const {
        fetchJson,
        setSessions,
        renderSessionsList
    } = deps;

    return async function refreshSessionsList() {
        const data = await fetchJson('/api/group-chat/sessions');
        setSessions(data.sessions || []);
        renderSessionsList();
    };
}
