import { createAsyncActionButton } from './role-card-ui.js';

export function appendRoleLibrarySessionEphemeralActions(actions, deps) {
    const {
        role,
        promoteEphemeralRole,
        deleteEphemeralRole,
        showToast
    } = deps;

    if (role.source === 'ephemeral' && !role.promoted_core_role_id) {
        actions.appendChild(createAsyncActionButton({
            label: '长期化',
            handler: async () => {
                await promoteEphemeralRole(role.id);
            },
            showToast
        }));
    }

    if (role.source === 'ephemeral') {
        actions.appendChild(createAsyncActionButton({
            label: role.promoted_core_role_id ? '删除临时记录' : '删除临时角色',
            handler: async () => {
                await deleteEphemeralRole(role.id);
            },
            variant: 'secondary',
            showToast
        }));
    }
}
