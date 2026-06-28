import { renderRoundRoleDebugPanel } from './round-role-selection-dom.js';

export function createRoundRoleSelectionDebugRenderer(deps) {
    const {
        getDom,
        getSelectableRoles,
        getLatestSelectionTraceForCurrentSession,
        buildRoundRoleDebugFromSelectionTrace,
        buildRoundRoleDebugPreview,
        getRoundRoleDebugBadgeClass
    } = deps;

    return function renderRoundRoleDebug(selectableRoles = getSelectableRoles()) {
        const dom = getDom();
        if (!dom.roundRoleDebug || !dom.roundRoleDebugMeta || !dom.roundRoleDebugList) {
            return;
        }

        const trace = getLatestSelectionTraceForCurrentSession();
        const preview = trace
            ? buildRoundRoleDebugFromSelectionTrace(trace)
            : buildRoundRoleDebugPreview(selectableRoles);
        renderRoundRoleDebugPanel({
            dom,
            preview,
            getRoundRoleDebugBadgeClass
        });
    };
}
