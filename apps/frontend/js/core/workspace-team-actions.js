import { createWorkspaceTeamCreateAction } from './workspace-team-create-action.js';
import { createWorkspaceTeamDraftActions } from './workspace-team-draft-actions.js';
import { createWorkspaceTeamManageActions } from './workspace-team-manage-actions.js';

export function createWorkspaceTeamActions(deps) {
    const createTeamFromForm = createWorkspaceTeamCreateAction(deps);
    const {
        startTeamDraft,
        copyDefaultTeamMembersToDraft
    } = createWorkspaceTeamDraftActions(deps);
    const {
        updateManagedTeamFromForm,
        deleteManagedTeam
    } = createWorkspaceTeamManageActions(deps);

    return {
        createTeamFromForm,
        startTeamDraft,
        copyDefaultTeamMembersToDraft,
        updateManagedTeamFromForm,
        deleteManagedTeam
    };
}
