import {
    MAIN_UI_DEP_KEYS,
    RUNTIME_BRIDGE_DEP_KEYS,
    RUNTIME_WIRING_DEP_KEYS
} from './app-modular-dep-keys.js';

function pickDeps(source, keys) {
    return keys.reduce((acc, key) => {
        acc[key] = source[key];
        return acc;
    }, {});
}

export function buildMainUiBindingDeps(ctx) {
    return pickDeps(ctx, MAIN_UI_DEP_KEYS);
}

export function buildRuntimeBridgeDeps(ctx) {
    return pickDeps(ctx, RUNTIME_BRIDGE_DEP_KEYS);
}

export function buildRuntimeWiringDeps(ctx) {
    const {
        stateAccessors,
        selectorsRuntime,
        runtimeBridges,
        ...rest
    } = pickDeps(ctx, RUNTIME_WIRING_DEP_KEYS);

    return {
        ...stateAccessors,
        ...selectorsRuntime,
        ...runtimeBridges,
        ...rest
    };
}
