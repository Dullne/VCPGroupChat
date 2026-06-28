export function createBindPersonRuntimeRoleAction(deps) {
    const {
        fetchJson,
        showToast,
        refreshBootstrap,
        renderAll
    } = deps;

    return async function bindPersonRuntimeRole(personId, roleId) {
        const normalizedPersonId = String(personId || '').trim();
        const normalizedRoleId = String(roleId || '').trim();
        if (!normalizedPersonId || !normalizedRoleId) {
            showToast('请选择人物和运行时角色', 'warning');
            return;
        }

        await fetchJson(`/api/persons/${encodeURIComponent(normalizedPersonId)}/runtime-role`, {
            method: 'PATCH',
            body: {
                role_id: normalizedRoleId
            }
        });

        await refreshBootstrap();
        renderAll();
    };
}
