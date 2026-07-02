import {
    resolveManagedProfileForGroupRoleActions,
    resolvePersonIdentityForRoleAction
} from './role-library-group-actions-context.js';
import { refreshGroupRoleActionsAfterMutation } from './role-library-group-actions-refresh.js';

export function createMoveRoleInManagedProfileAction(deps) {
    const {
        getManagedProfile,
        showToast,
        fetchJson,
        getAvailableRoles,
        getBootstrapData,
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

        const personIdentity = resolvePersonIdentityForRoleAction({
            roleId,
            getAvailableRoles,
            getBootstrapData
        });
        if (!personIdentity) {
            showToast('这不是长期人物，请先创建人物或绑定到人物后再调整顺序', 'warning');
            return;
        }

        await fetchJson(
            `/api/group-profiles/${encodeURIComponent(profile.id)}/person-members/${encodeURIComponent(personIdentity.id)}/order`,
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
