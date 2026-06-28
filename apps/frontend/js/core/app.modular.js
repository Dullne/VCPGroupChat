import { createDomBindings } from './dom-bindings.js';
import {
    buildMainUiBindingDeps
} from './app-modular-deps-builders.js';
import { createAppModularRuntimeContext } from './app-modular-runtime-context.js';
import { mountApp } from './app-bootstrap.js';
import { bindMainUi } from './ui-binding-runtime.js';
import {
    fileToDataUrl as fileToDataUrlModule
} from '../utils/formatting.js';
import { showToast } from '../utils/ui-helpers.js';
import { state } from './state.js';


let appBootstrapped = false;
let runtimeWiringContext = null;
const runtimeContext = createAppModularRuntimeContext({ bindUi });

runtimeWiringContext = runtimeContext.runtimeWiringContext;

mountApp({
    getDocument: () => document,
    isBootstrapped: () => appBootstrapped,
    markBootstrapped: () => {
        appBootstrapped = true;
    },
    setDom: value => {
        state.dom = value;
    },
    createDomBindings,
    initialize: runtimeContext.runtimeBridges.initialize,
    showToast
});

function bindUi() {
    bindMainUi(buildMainUiBindingDeps({
        ...runtimeWiringContext,
        fileToDataUrl: fileToDataUrlModule
    }));
}
