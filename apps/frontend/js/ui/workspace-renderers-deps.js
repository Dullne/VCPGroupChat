import { buildWorkspaceRendererModeAndTeamDeps } from './workspace-renderers-deps-core.js';
import { buildWorkspaceRendererGroupDeps } from './workspace-renderers-deps-group.js';
import { buildWorkspaceRendererCurrentProfileSummaryDeps } from './workspace-renderers-deps-profile.js';

export function buildWorkspaceRendererDepsBundles(deps) {
    return {
        ...buildWorkspaceRendererModeAndTeamDeps(deps),
        ...buildWorkspaceRendererGroupDeps(deps),
        ...buildWorkspaceRendererCurrentProfileSummaryDeps(deps)
    };
}
