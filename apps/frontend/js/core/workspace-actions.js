import { createWorkspaceTeamActions } from './workspace-team-actions.js';
import { createWorkspaceProfileActions } from './workspace-profile-actions.js';

export function createWorkspaceActions(deps) {
    return {
        ...createWorkspaceTeamActions(deps),
        ...createWorkspaceProfileActions(deps)
    };
}
