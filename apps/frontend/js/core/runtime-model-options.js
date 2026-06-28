import { createRuntimeModelOptionReaders } from './runtime-model-option-readers.js';
import { createRuntimeModelOptionRenderers } from './runtime-model-option-renderers.js';

export function createRuntimeModelOptionHelpers(deps) {
    const readers = createRuntimeModelOptionReaders(deps);
    const renderers = createRuntimeModelOptionRenderers({
        getDom: deps.getDom,
        getSelectedRoleStudioModel: deps.getSelectedRoleStudioModel,
        ...readers
    });

    return {
        ...readers,
        ...renderers
    };
}
