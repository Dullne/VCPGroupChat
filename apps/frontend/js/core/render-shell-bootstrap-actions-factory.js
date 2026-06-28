import { createBootstrapActions } from './bootstrap-actions.js';
import { buildRenderShellBootstrapActionsDeps } from './render-shell-bootstrap-actions-deps.js';

export function createRenderShellBootstrapActions(deps) {
    return createBootstrapActions(buildRenderShellBootstrapActionsDeps(deps));
}
