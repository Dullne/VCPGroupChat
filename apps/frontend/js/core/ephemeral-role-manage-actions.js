import { createEphemeralRolePromoteAction } from './ephemeral-role-promote-action.js';
import { createEphemeralRoleDeleteAction } from './ephemeral-role-delete-action.js';

export function createEphemeralRoleManagementActions(deps) {
    return {
        promoteEphemeralRole: createEphemeralRolePromoteAction(deps),
        deleteEphemeralRole: createEphemeralRoleDeleteAction(deps)
    };
}
