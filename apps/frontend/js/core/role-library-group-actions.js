import { createAddRoleToGroupAction } from './role-library-group-action-add.js';
import { createRemoveRoleFromGroupAction } from './role-library-group-action-remove.js';
import { createMoveRoleInManagedProfileAction } from './role-library-group-action-move.js';

export function createRoleLibraryGroupActions(deps) {
    const addRoleToGroup = createAddRoleToGroupAction(deps);
    const removeRoleFromGroup = createRemoveRoleFromGroupAction(deps);
    const moveRoleInManagedProfile = createMoveRoleInManagedProfileAction(deps);

    return {
        addRoleToGroup,
        removeRoleFromGroup,
        moveRoleInManagedProfile
    };
}
