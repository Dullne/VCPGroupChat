import { createRoleLibraryImportCurrentAction } from './role-library-import-current-action.js';
import { createRoleLibraryImportNewProfileAction } from './role-library-import-new-profile-action.js';

export function createRoleLibraryImportActions(deps) {
    const importCatalogRole = createRoleLibraryImportCurrentAction(deps);
    const importCatalogRoleToNewProfile = createRoleLibraryImportNewProfileAction(deps);

    return {
        importCatalogRole,
        importCatalogRoleToNewProfile
    };
}
