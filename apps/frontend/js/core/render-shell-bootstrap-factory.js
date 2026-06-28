import { createRenderShellRuntimeUiActions } from './render-shell-runtime-ui-factory.js';
import { createRenderShellRenderer } from './render-shell-shell-renderer-factory.js';
import { createRenderShellBootstrapActions } from './render-shell-bootstrap-actions-factory.js';

export function createRenderShellBootstrap(deps) {
    const runtimeUiActions = createRenderShellRuntimeUiActions(deps);
    const shellRenderer = createRenderShellRenderer(deps);
    const bootstrapActions = createRenderShellBootstrapActions(deps);

    return { runtimeUiActions, shellRenderer, bootstrapActions };
}
