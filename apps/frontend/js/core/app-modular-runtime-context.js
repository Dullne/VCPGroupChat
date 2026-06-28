import { createAppRuntimeWiring } from './app-runtime-wiring.js';
import { createRuntimeBridgesForApp } from './app-runtime-bridges-factory.js';
import { createRuntimeWiringContextForApp } from './app-runtime-wiring-context-factory.js';
import { createSelectorsRuntimeForApp } from './app-selectors-runtime-context.js';
import {
    MUTE_STORAGE_KEY,
    DARK_MODE_STORAGE_KEY
} from './constants.js';
import { createAppStateAccessors } from './app-state-accessors.js';
import { state } from './state.js';

export function createAppModularRuntimeContext(deps) {
    const { bindUi } = deps;
    const runtime = {};

    const stateAccessors = createAppStateAccessors({
        state,
        darkModeStorageKey: DARK_MODE_STORAGE_KEY,
        muteStorageKey: MUTE_STORAGE_KEY
    });

    const { selectorsRuntime, getTeams, getConfig, getDom } = createSelectorsRuntimeForApp(stateAccessors);

    const runtimeBridges = createRuntimeBridgesForApp({
        runtime,
        selectorsRuntime,
        getTeams,
        getConfig,
        getDom
    });

    const runtimeWiringContext = createRuntimeWiringContextForApp({
        stateAccessors,
        selectorsRuntime,
        runtimeBridges,
        bindUi
    });

    Object.assign(runtime, createAppRuntimeWiring(runtimeWiringContext));

    return {
        runtimeBridges,
        runtimeWiringContext
    };
}
