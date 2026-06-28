import { createBootstrapConfigHelpers } from './bootstrap-config.js';
import { createBootstrapRuntimeActions } from './bootstrap-runtime-actions.js';

export function createBootstrapActions(deps) {
    const configHelpers = createBootstrapConfigHelpers(deps);
    const runtimeActions = createBootstrapRuntimeActions({
        ...deps,
        ...configHelpers
    });

    return {
        ...runtimeActions,
        ...configHelpers
    };
}
