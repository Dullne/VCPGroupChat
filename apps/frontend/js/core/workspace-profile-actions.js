import { createWorkspaceProfileFormLoader } from './workspace-profile-form-loader.js';
import { createWorkspaceProfileCreateSessionActions } from './workspace-profile-create-session-actions.js';
import { createWorkspaceProfileMaintenanceActions } from './workspace-profile-maintenance-actions.js';

export function createWorkspaceProfileActions(deps) {
    const formLoader = createWorkspaceProfileFormLoader(deps);
    const createSessionActions = createWorkspaceProfileCreateSessionActions({
        ...deps,
        ...formLoader
    });
    const maintenanceActions = createWorkspaceProfileMaintenanceActions(deps);

    return {
        ...formLoader,
        ...createSessionActions,
        ...maintenanceActions
    };
}
