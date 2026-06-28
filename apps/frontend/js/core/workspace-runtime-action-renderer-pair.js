import { createWorkspaceRenderersRef } from './workspace-runtime-renderers-ref.js';
import { createWorkspaceRuntimeActions } from './workspace-runtime-actions-factory.js';
import { createWorkspaceRuntimeRenderers } from './workspace-runtime-renderers-factory.js';

export function createWorkspaceActionRendererPair(deps) {
    const renderersRef = createWorkspaceRenderersRef();

    const {
        workspaceActions,
        roleLibraryActions
    } = createWorkspaceRuntimeActions({
        ...deps,
        renderGroupProfileFormStatus: (...args) =>
            renderersRef.getWorkspaceRenderers().renderGroupProfileFormStatus(...args)
    });

    const workspaceRenderers = createWorkspaceRuntimeRenderers({
        ...deps,
        workspaceActions
    });
    renderersRef.setWorkspaceRenderers(workspaceRenderers);

    return {
        workspaceActions,
        roleLibraryActions,
        workspaceRenderers
    };
}
