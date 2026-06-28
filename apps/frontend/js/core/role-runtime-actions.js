export function createRoleRuntimeActions(deps) {
    const {
        getActiveSession,
        getManagedProfileId,
        fetchJson,
        reloadActiveSessionAndRoles,
        refreshBootstrap,
        renderAll
    } = deps;

    async function updateRoleRuntimeModel(role, model) {
        const normalizedModel = String(model || '').trim();
        const activeSession = getActiveSession();

        if (role.source === 'ephemeral' && !role.promoted_core_role_id) {
            await fetchJson(
                `/api/group-chat/sessions/${encodeURIComponent(activeSession.id)}/ephemeral-roles/${encodeURIComponent(role.id)}/model`,
                {
                    method: 'PATCH',
                    body: { model: normalizedModel }
                }
            );
            await reloadActiveSessionAndRoles();
            renderAll();
            return;
        }

        await fetchJson(`/api/core-roles/${encodeURIComponent(role.id)}/model`, {
            method: 'PATCH',
            body: { model: normalizedModel }
        });

        await refreshBootstrap(activeSession?.profile_id || getManagedProfileId());
        await reloadActiveSessionAndRoles();
        renderAll();
    }

    return {
        updateRoleRuntimeModel
    };
}
