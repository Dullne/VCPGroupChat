import {
    buildWorkspaceEphemeralRoleActions,
    buildWorkspaceRoleStudioRenderer,
    buildWorkspaceRoleStudioActions,
    buildWorkspaceRoleRuntimeActions
} from './workspace-runtime-studio-and-role-builders.js';
import { createRoleStudioSourcesRuntime } from './role-studio-sources-runtime.js';

export function createWorkspaceStudioAndRoleActions(deps) {
    const roleStudioSourceRuntime = createRoleStudioSourcesRuntime(deps);

    return {
        ephemeralRoleActions: buildWorkspaceEphemeralRoleActions(deps),
        roleStudioActions: buildWorkspaceRoleStudioActions(deps),
        roleStudioSourceRuntime,
        roleStudioRenderer: buildWorkspaceRoleStudioRenderer({
            ...deps,
            renderRoleStudioSources: (...args) => roleStudioSourceRuntime.renderRoleStudioSources(...args)
        }),
        roleRuntimeActions: buildWorkspaceRoleRuntimeActions(deps)
    };
}
