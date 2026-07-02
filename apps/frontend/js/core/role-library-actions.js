import { createRoleLibraryGroupActions } from './role-library-group-actions.js';
import { createRoleLibraryTeamActions } from './role-library-team-actions.js';
import { createBindPersonRuntimeRoleAction } from './role-library-person-action-bind-runtime-role.js';
import { createGeneratePersonRuntimeRoleAction } from './role-library-person-action-generate-runtime-role.js';
import { createRepairPersonRuntimeRolesAction } from './role-library-person-action-repair-runtime-roles.js';
import { createEnrichSparsePersonProfilesAction } from './role-library-person-action-enrich-profiles.js';

export function createRoleLibraryActions(deps) {
    return {
        bindPersonRuntimeRole: createBindPersonRuntimeRoleAction(deps),
        generatePersonRuntimeRole: createGeneratePersonRuntimeRoleAction(deps),
        repairMissingRuntimeRoles: createRepairPersonRuntimeRolesAction(deps),
        enrichSparsePersonProfiles: createEnrichSparsePersonProfilesAction(deps),
        ...createRoleLibraryTeamActions(deps),
        ...createRoleLibraryGroupActions(deps)
    };
}
