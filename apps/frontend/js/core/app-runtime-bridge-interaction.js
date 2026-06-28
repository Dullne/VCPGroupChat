import { createRuntimeInteractionUiSessionBridges } from './app-runtime-bridge-interaction-ui-session.js';
import { createRuntimeInteractionModelBridges } from './app-runtime-bridge-interaction-models.js';
import { createRuntimeInteractionRoleDraftBridges } from './app-runtime-bridge-interaction-role-draft.js';
import { createRuntimeInteractionRoleLibraryBridges } from './app-runtime-bridge-interaction-role-library.js';

export function createRuntimeInteractionBridges(deps) {
    return {
        ...createRuntimeInteractionUiSessionBridges(deps),
        ...createRuntimeInteractionModelBridges(deps),
        ...createRuntimeInteractionRoleDraftBridges(deps),
        ...createRuntimeInteractionRoleLibraryBridges(deps)
    };
}
