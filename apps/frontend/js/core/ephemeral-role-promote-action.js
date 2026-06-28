import { findEphemeralRoleById } from './ephemeral-role-manage-helpers.js';

export function createEphemeralRolePromoteAction(deps) {
    const {
        getActiveSession,
        fetchJson,
        showToast,
        refreshBootstrap,
        reloadActiveSessionAndRoles,
        renderAll
    } = deps;

    return async function promoteEphemeralRole(ephemeralRoleId) {
        const activeSession = getActiveSession();
        if (!activeSession?.id) {
            return;
        }

        const ephemeralRole = findEphemeralRoleById(activeSession, ephemeralRoleId);
        if (!ephemeralRole) {
            showToast('未找到临时角色', 'warning');
            return;
        }

        await fetchJson(
            `/api/group-chat/sessions/${encodeURIComponent(activeSession.id)}/ephemeral-roles/${encodeURIComponent(ephemeralRoleId)}/promote`,
            {
                method: 'POST',
                body: {}
            }
        );

        await refreshBootstrap(activeSession.profile_id);
        await reloadActiveSessionAndRoles();
        renderAll();
    };
}
