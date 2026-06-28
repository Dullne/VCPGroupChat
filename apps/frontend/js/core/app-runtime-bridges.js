import { createRuntimeInteractionBridges } from './app-runtime-bridge-interaction.js';
import { createRuntimeWorkspaceBridges } from './app-runtime-bridge-workspace.js';

export function createAppRuntimeBridges(deps) {
    return {
        ...createRuntimeInteractionBridges(deps),
        ...createRuntimeWorkspaceBridges(deps)
    };
}
