import { createAddRoleToTeamAction } from './role-library-team-action-add.js';
import { createRemoveRoleFromTeamAction } from './role-library-team-action-remove.js';

export function createRoleLibraryTeamActions(deps) {
    const addRoleToTeam = createAddRoleToTeamAction(deps);
    const removeRoleFromTeam = createRemoveRoleFromTeamAction(deps);

    return {
        addRoleToTeam,
        removeRoleFromTeam
    };
}
