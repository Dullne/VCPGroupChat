import { createRuntimeModelOptionHelpers } from './runtime-model-options.js';
import { createRuntimeModelPreferenceHelpers } from './runtime-model-preferences.js';

export function createRuntimeModelManager(deps) {
    const optionHelpers = createRuntimeModelOptionHelpers(deps);
    const preferenceHelpers = createRuntimeModelPreferenceHelpers({
        ...deps,
        ...optionHelpers
    });

    return {
        ...optionHelpers,
        ...preferenceHelpers
    };
}
