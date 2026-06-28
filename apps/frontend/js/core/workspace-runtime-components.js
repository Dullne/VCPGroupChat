import { createWorkspaceActionRendererPair } from './workspace-runtime-action-renderer-pair.js';
import { createWorkspaceStudioAndRoleActions } from './workspace-runtime-studio-and-role-actions.js';

export function createWorkspaceRuntimeComponents(deps) {
    const {
        workspaceActions,
        roleLibraryActions,
        workspaceRenderers
    } = createWorkspaceActionRendererPair(deps);
    const {
        ephemeralRoleActions,
        roleStudioActions,
        roleStudioSourceRuntime,
        roleStudioRenderer,
        roleRuntimeActions
    } = createWorkspaceStudioAndRoleActions(deps);

    return {
        workspaceActions,
        ephemeralRoleActions,
        roleStudioActions,
        roleStudioSourceRuntime,
        roleLibraryActions,
        workspaceRenderers,
        roleStudioRenderer,
        roleRuntimeActions
    };
}
