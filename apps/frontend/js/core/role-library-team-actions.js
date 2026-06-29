import { createAddRoleToTeamAction } from './role-library-team-action-add.js';
import { createRemoveRoleFromTeamAction } from './role-library-team-action-remove.js';
import { createTeamDraftRoleActions } from './role-library-team-draft-actions.js';

export function createRoleLibraryTeamActions(deps) {
    const addRoleToTeam = createAddRoleToTeamAction(deps);
    const removeRoleFromTeam = createRemoveRoleFromTeamAction(deps);
    const teamDraftRoleActions = createTeamDraftRoleActions(deps);

    return {
        addRoleToTeam,
        removeRoleFromTeam,
        ...teamDraftRoleActions
    };
}
