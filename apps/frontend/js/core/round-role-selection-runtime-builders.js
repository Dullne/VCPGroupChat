import { createRoundRoleSelectionTraceHelpers } from './round-role-selection-trace.js';
import { createRoundRoleSelectionPreviewBuilder } from './round-role-selection-preview.js';
import { createRoundRoleSelectionSummaryRenderer } from './round-role-selection-summary.js';
import { createRoundRoleSelectionListRenderer } from './round-role-selection-list-renderer.js';
import { createRoundRoleSelectionDebugRenderer } from './round-role-selection-debug-renderer.js';

export function buildRoundRoleSelectionTraceRuntime(deps) {
    return createRoundRoleSelectionTraceHelpers(deps);
}

export function buildRoundRoleSelectionPreviewRuntime(deps) {
    return createRoundRoleSelectionPreviewBuilder(deps);
}

export function buildRoundRoleSelectionRenderers(deps) {
    const renderRoundRoleDebug = createRoundRoleSelectionDebugRenderer(deps);
    const { renderRoleSelectionSummary } = createRoundRoleSelectionSummaryRenderer({
        ...deps,
        renderRoundRoleDebug
    });
    const renderRoleSelectionList = createRoundRoleSelectionListRenderer({
        ...deps,
        getRenderRoleSelectionSummary: () => renderRoleSelectionSummary
    });

    return {
        renderRoundRoleDebug,
        renderRoleSelectionSummary,
        renderRoleSelectionList
    };
}
