import { createWorkspaceTeamUpdateAction } from './workspace-team-update-action.js';
import { createWorkspaceTeamDeleteAction } from './workspace-team-delete-action.js';

export function createWorkspaceTeamManageActions(deps) {
    const updateManagedTeamFromForm = createWorkspaceTeamUpdateAction(deps);
    const deleteManagedTeam = createWorkspaceTeamDeleteAction(deps);

    return {
        updateManagedTeamFromForm,
        deleteManagedTeam
    };
}
