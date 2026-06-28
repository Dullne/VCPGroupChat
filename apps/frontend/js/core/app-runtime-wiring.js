import { createCoreRuntime } from './core-runtime-factory.js';
import { createWorkspaceRuntime } from './workspace-runtime-factory.js';
import { createRenderShellBootstrap } from './render-shell-bootstrap-factory.js';

export function createAppRuntimeWiring(deps) {
    const coreRuntime = createCoreRuntime(deps);

    const getGroupProfileFormLoadedProfileId = (...args) =>
        coreRuntime.teamProfileManager.getGroupProfileFormLoadedProfileId(...args);
    const setGroupProfileFormLoadedProfileId = (...args) =>
        coreRuntime.teamProfileManager.setGroupProfileFormLoadedProfileId(...args);

    const workspaceRuntime = createWorkspaceRuntime({
        ...deps,
        ...coreRuntime,
        getGroupProfileFormLoadedProfileId,
        setGroupProfileFormLoadedProfileId
    });

    const renderShellRuntime = createRenderShellBootstrap({
        ...deps,
        ...coreRuntime,
        ...workspaceRuntime,
        getSelectedProfileIdForBootstrap: deps.getSelectedProfileId
    });

    return {
        ...coreRuntime,
        ...workspaceRuntime,
        ...renderShellRuntime
    };
}
