import { createRuntimeInteractionUiBridges } from './app-runtime-bridge-interaction-ui-session-ui.js';
import { createRuntimeInteractionUiSessionWorkspaceBridges } from './app-runtime-bridge-interaction-ui-session-workspace.js';
import { createRuntimeInteractionUiSessionUtilityBridges } from './app-runtime-bridge-interaction-ui-session-utils.js';

export function createRuntimeInteractionUiSessionBridges(deps) {
    return {
        ...createRuntimeInteractionUiBridges(deps),
        ...createRuntimeInteractionUiSessionWorkspaceBridges(deps),
        ...createRuntimeInteractionUiSessionUtilityBridges(deps)
    };
}
