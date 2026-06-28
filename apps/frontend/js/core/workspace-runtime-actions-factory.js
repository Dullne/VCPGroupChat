import { buildWorkspaceActionsForRuntime } from './workspace-runtime-workspace-actions-builder.js';
import { buildRoleLibraryActionsForRuntime } from './workspace-runtime-role-library-actions-builder.js';

export function createWorkspaceRuntimeActions(deps) {
    const workspaceActions = buildWorkspaceActionsForRuntime(deps);
    const roleLibraryActions = buildRoleLibraryActionsForRuntime(deps);

    return {
        workspaceActions,
        roleLibraryActions
    };
}
