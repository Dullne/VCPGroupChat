import {
    resolveManagedProfileForGroupRoleActions,
    resolvePersonIdentityForRoleAction
} from './role-library-group-actions-context.js';
import { refreshGroupRoleActionsAfterMutation } from './role-library-group-actions-refresh.js';

export function createAddRoleToGroupAction(deps) {
    const {
        getManagedProfile,
        showToast,
        fetchJson,
        getAvailableRoles,
        getBootstrapData,
        refreshBootstrap,
        renderAll
    } = deps;

    return async function addRoleToGroup(roleId) {
        const profile = resolveManagedProfileForGroupRoleActions({
            getManagedProfile,
            showToast,
            toastWhenMissing: true
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
            if (!personIdentity.legacy_role_id) {
                showToast('这个人物还没有连接运行时角色，暂时不能拉入群组', 'warning');
                return;
            }

            await fetchJson(`/api/group-profiles/${encodeURIComponent(profile.id)}/person-members`, {
                method: 'POST',
                body: {
                    person_id: personIdentity.id
                }
            });

            await refreshGroupRoleActionsAfterMutation({
                profileId: profile.id,
                refreshBootstrap,
                renderAll
            });
            return;
        }

        showToast('这不是长期人物，请先创建人物或绑定到人物后再加入群组', 'warning');
    };
}
