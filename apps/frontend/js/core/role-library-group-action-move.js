import { resolveManagedProfileForGroupRoleActions } from './role-library-group-actions-context.js';
import { refreshGroupRoleActionsAfterMutation } from './role-library-group-actions-refresh.js';

export function createMoveRoleInManagedProfileAction(deps) {
    const {
        getManagedProfile,
        showToast,
        fetchJson,
        getActiveSession,
        refreshBootstrap,
        reloadActiveSessionAndRoles,
        renderAll
    } = deps;

    return async function moveRoleInManagedProfile(roleId, direction) {
        const profile = resolveManagedProfileForGroupRoleActions({
            getManagedProfile,
            showToast
        });
        if (!profile) {
            return;
        }

        await fetchJson(
            `/api/group-profiles/${encodeURIComponent(profile.id)}/members/${encodeURIComponent(roleId)}/order`,
            {
                method: 'PATCH',
                body: { direction }
            }
        );

        const activeSession = getActiveSession();
        await refreshGroupRoleActionsAfterMutation({
            profileId: profile.id,
            refreshBootstrap,
            renderAll,
            activeSessionProfileId: activeSession?.profile_id,
            reloadActiveSessionAndRoles
        });
    };
}
