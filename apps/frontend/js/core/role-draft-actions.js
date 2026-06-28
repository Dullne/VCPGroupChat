import { createRoleDraftIdeaAction } from './role-draft-idea-action.js';

export function createRoleDraftActions(deps) {
    return {
        draftRoleIdeaIntoForm: createRoleDraftIdeaAction(deps)
    };
}
