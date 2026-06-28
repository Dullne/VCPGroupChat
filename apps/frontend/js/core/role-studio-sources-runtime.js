import { createRoleStudioSourceActions } from './role-studio-source-actions.js';
import { createRoleStudioSourcesRenderer } from '../ui/role-studio-sources-renderer.js';

export function createRoleStudioSourcesRuntime(deps) {
    let sourceActions = null;

    const sourcesRenderer = createRoleStudioSourcesRenderer({
        ...deps,
        selectRoleStudioEngine: (...args) => sourceActions.selectRoleStudioEngine(...args),
        toggleRoleStudioReference: (...args) => sourceActions.toggleRoleStudioReference(...args)
    });

    sourceActions = createRoleStudioSourceActions({
        ...deps,
        renderRoleStudioSources: (...args) => sourcesRenderer.renderRoleStudioSources(...args)
    });

    return {
        ...sourceActions,
        ...sourcesRenderer
    };
}
