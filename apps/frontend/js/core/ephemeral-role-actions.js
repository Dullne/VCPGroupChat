import { createEphemeralRoleCreateAction } from './ephemeral-role-create-action.js';
import { createEphemeralRoleManagementActions } from './ephemeral-role-manage-actions.js';

export function createEphemeralRoleActions(deps) {
    const createEphemeralRole = createEphemeralRoleCreateAction(deps);
    const {
        promoteEphemeralRole,
        deleteEphemeralRole
    } = createEphemeralRoleManagementActions(deps);

    return {
        createEphemeralRole,
        promoteEphemeralRole,
        deleteEphemeralRole
    };
}
