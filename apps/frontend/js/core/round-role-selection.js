import {
    buildRoundRoleSelectionTraceRuntime,
    buildRoundRoleSelectionPreviewRuntime,
    buildRoundRoleSelectionRenderers
} from './round-role-selection-runtime-builders.js';

export function createRoundRoleSelectionRuntime(deps) {
    const {
        clearLatestSelectionTrace,
        getLatestSelectionTraceForCurrentSession,
        buildRoundRoleDebugFromSelectionTrace
    } = buildRoundRoleSelectionTraceRuntime(deps);
    const { buildRoundRoleDebugPreview } = buildRoundRoleSelectionPreviewRuntime(deps);
    const {
        renderRoundRoleDebug,
        renderRoleSelectionSummary,
        renderRoleSelectionList
    } = buildRoundRoleSelectionRenderers({
        ...deps,
        clearLatestSelectionTrace,
        getLatestSelectionTraceForCurrentSession,
        buildRoundRoleDebugFromSelectionTrace,
        buildRoundRoleDebugPreview
    });

    return {
        renderRoleSelectionList,
        buildRoundRoleDebugPreview,
        clearLatestSelectionTrace,
        getLatestSelectionTraceForCurrentSession,
        buildRoundRoleDebugFromSelectionTrace,
        renderRoundRoleDebug,
        renderRoleSelectionSummary
    };
}
