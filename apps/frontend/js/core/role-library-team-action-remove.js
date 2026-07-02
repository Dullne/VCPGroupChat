import {
    resolveManagedTeamIdForRoleActions,
    resolvePersonIdentityForRoleAction
} from './role-library-group-actions-context.js';

export function createRemoveRoleFromTeamAction(deps) {
    const {
        getManagedTeamId,
        showToast,
        fetchJson,
        getAvailableRoles,
        getBootstrapData,
        refreshBootstrap,
        renderAll
    } = deps;

    return async function removeRoleFromTeam(roleId) {
        const teamId = resolveManagedTeamIdForRoleActions({
            getManagedTeamId,
            showToast,
            toastWhenMissing: true
        });
        if (!teamId) {
            return;
        }

        const personIdentity = resolvePersonIdentityForRoleAction({
            roleId,
            getAvailableRoles,
            getBootstrapData
        });
        if (personIdentity) {
            await fetchJson(
                `/api/teams/${encodeURIComponent(teamId)}/person-members/${encodeURIComponent(personIdentity.id)}`,
                { method: 'DELETE' }
            );

            await refreshBootstrap();
            renderAll();
            return;
        }

        showToast('这是运行时兼容角色，不是长期人物；团队池只移除人物', 'warning');
    };
}
