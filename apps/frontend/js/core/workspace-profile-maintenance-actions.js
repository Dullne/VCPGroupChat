import { createWorkspaceProfileSaveAction } from './workspace-profile-save-action.js';
import { createWorkspaceProfileDeleteAction } from './workspace-profile-delete-action.js';

export function createWorkspaceProfileMaintenanceActions(deps) {
    const saveManagedProfileFromForm = createWorkspaceProfileSaveAction(deps);
    const deleteManagedProfile = createWorkspaceProfileDeleteAction(deps);

    return {
        saveManagedProfileFromForm,
        deleteManagedProfile
    };
}
