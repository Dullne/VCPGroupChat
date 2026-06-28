import { createWorkspaceTeamCreateAction } from './workspace-team-create-action.js';
import { createWorkspaceTeamManageActions } from './workspace-team-manage-actions.js';

export function createWorkspaceTeamActions(deps) {
    const createTeamFromForm = createWorkspaceTeamCreateAction(deps);
    const {
        updateManagedTeamFromForm,
        deleteManagedTeam
    } = createWorkspaceTeamManageActions(deps);

    return {
        createTeamFromForm,
        updateManagedTeamFromForm,
        deleteManagedTeam
    };
}
