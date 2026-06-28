import {
    findEphemeralRoleById,
    buildDeleteEphemeralRoleConfirmText
} from './ephemeral-role-manage-helpers.js';

export function createEphemeralRoleDeleteAction(deps) {
    const {
        getActiveSession,
        fetchJson,
        showToast,
        reloadActiveSessionAndRoles,
        renderAll
    } = deps;

    return async function deleteEphemeralRole(ephemeralRoleId) {
        const activeSession = getActiveSession();
        if (!activeSession?.id) {
            return;
        }

        const ephemeralRole = findEphemeralRoleById(activeSession, ephemeralRoleId);
        if (!ephemeralRole) {
            showToast('未找到临时角色', 'warning');
            return;
        }

        const confirmText = buildDeleteEphemeralRoleConfirmText(ephemeralRole);
        if (!window.confirm(confirmText)) {
            return;
        }

        await fetchJson(
            `/api/group-chat/sessions/${encodeURIComponent(activeSession.id)}/ephemeral-roles/${encodeURIComponent(ephemeralRoleId)}`,
            {
                method: 'DELETE'
            }
        );

        await reloadActiveSessionAndRoles();
        renderAll();
    };
}
