import { buildRuntimeWiringDeps } from './app-modular-deps-builders.js';
import { buildRuntimeWiringStaticDeps } from './app-runtime-wiring-context-static-deps.js';

export function createRuntimeWiringContextForApp(deps) {
    const {
        stateAccessors,
        selectorsRuntime,
        runtimeBridges,
        bindUi
    } = deps;

    return buildRuntimeWiringDeps({
        stateAccessors,
        selectorsRuntime,
        runtimeBridges,
        ...buildRuntimeWiringStaticDeps(bindUi)
    });
}
