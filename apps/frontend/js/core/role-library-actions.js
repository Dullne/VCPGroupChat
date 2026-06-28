import { createRoleLibraryGroupActions } from './role-library-group-actions.js';
import { createRoleLibraryTeamActions } from './role-library-team-actions.js';
import { createRoleLibraryImportActions } from './role-library-import-actions.js';
import { createBindPersonRuntimeRoleAction } from './role-library-person-action-bind-runtime-role.js';
import { createGeneratePersonRuntimeRoleAction } from './role-library-person-action-generate-runtime-role.js';

export function createRoleLibraryActions(deps) {
    return {
        bindPersonRuntimeRole: createBindPersonRuntimeRoleAction(deps),
        generatePersonRuntimeRole: createGeneratePersonRuntimeRoleAction(deps),
        ...createRoleLibraryTeamActions(deps),
        ...createRoleLibraryGroupActions(deps),
        ...createRoleLibraryImportActions(deps)
    };
}
