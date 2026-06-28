export function createGeneratePersonRuntimeRoleAction(deps) {
    const {
        fetchJson,
        showToast,
        refreshBootstrap,
        renderAll
    } = deps;

    return async function generatePersonRuntimeRole(personId) {
        const normalizedPersonId = String(personId || '').trim();
        if (!normalizedPersonId) {
            showToast('请选择长期人物', 'warning');
            return;
        }

        await fetchJson(`/api/persons/${encodeURIComponent(normalizedPersonId)}/runtime-role/generate`, {
            method: 'POST',
            body: {}
        });

        await refreshBootstrap();
        renderAll();
    };
}
