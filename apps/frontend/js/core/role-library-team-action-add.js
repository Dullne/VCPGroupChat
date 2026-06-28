import {
    resolveManagedTeamIdForRoleActions,
    resolvePersonIdentityForRoleAction,
    resolveRoleNameForGroupAction
} from './role-library-group-actions-context.js';

export function createAddRoleToTeamAction(deps) {
    const {
        getManagedTeamId,
        showToast,
        fetchJson,
        getAvailableRoles,
        getBootstrapData,
        refreshBootstrap,
        renderAll
    } = deps;

    return async function addRoleToTeam(roleId) {
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
            if (!personIdentity.legacy_role_id) {
                showToast('这个人物还没有连接运行时角色，暂时不能加入团队', 'warning');
                return;
            }

            await fetchJson(`/api/teams/${encodeURIComponent(teamId)}/person-members`, {
                method: 'POST',
                body: {
                    person_id: personIdentity.id
                }
            });

            await refreshBootstrap();
            renderAll();
            return;
        }

        await fetchJson(`/api/teams/${encodeURIComponent(teamId)}/members`, {
            method: 'POST',
            body: {
                role_id: roleId,
                role_name: resolveRoleNameForGroupAction({
                    roleId,
                    getAvailableRoles,
                    getBootstrapData
                })
            }
        });

        await refreshBootstrap();
        renderAll();
    };
}
