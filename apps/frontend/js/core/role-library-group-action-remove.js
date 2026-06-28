import {
    resolveManagedProfileForGroupRoleActions,
    resolvePersonIdentityForRoleAction
} from './role-library-group-actions-context.js';
import { refreshGroupRoleActionsAfterMutation } from './role-library-group-actions-refresh.js';

export function createRemoveRoleFromGroupAction(deps) {
    const {
        getManagedProfile,
        showToast,
        fetchJson,
        getAvailableRoles,
        getBootstrapData,
        refreshBootstrap,
        renderAll
    } = deps;

    return async function removeRoleFromGroup(roleId) {
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
        if (personIdentity) {
            await fetchJson(
                `/api/group-profiles/${encodeURIComponent(profile.id)}/person-members/${encodeURIComponent(personIdentity.id)}`,
                { method: 'DELETE' }
            );

            await refreshGroupRoleActionsAfterMutation({
                profileId: profile.id,
                refreshBootstrap,
                renderAll
            });
            return;
        }

        await fetchJson(`/api/group-profiles/${encodeURIComponent(profile.id)}/members/${encodeURIComponent(roleId)}`, {
            method: 'DELETE'
        });

        await refreshGroupRoleActionsAfterMutation({
            profileId: profile.id,
            refreshBootstrap,
            renderAll
        });
    };
}
