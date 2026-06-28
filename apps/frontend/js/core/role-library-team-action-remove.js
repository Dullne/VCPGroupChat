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

        await fetchJson(
            `/api/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(roleId)}`,
            { method: 'DELETE' }
        );

        await refreshBootstrap();
        renderAll();
    };
}
