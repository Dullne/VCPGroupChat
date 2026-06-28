import { buildRoundRoleTraceRows } from './round-role-selection-trace-rows.js';
import { buildRoundRoleTraceMeta } from './round-role-selection-trace-meta.js';

export function createRoundRoleSelectionTraceHelpers(deps) {
    const {
        getLatestSelectionTrace,
        setLatestSelectionTrace,
        getActiveSession,
        getProfileModeLabel,
        normalizeNatureRandomModeOptions
    } = deps;

    function clearLatestSelectionTrace() {
        setLatestSelectionTrace(null);
    }

    function getLatestSelectionTraceForCurrentSession() {
        const latestSelectionTrace = getLatestSelectionTrace();
        const activeSession = getActiveSession();
        if (!latestSelectionTrace || !activeSession?.id) {
            return null;
        }
        if (String(latestSelectionTrace.session_id || '') !== String(activeSession.id)) {
            return null;
        }
        return latestSelectionTrace;
    }

    function buildRoundRoleDebugFromSelectionTrace(trace) {
        const rows = buildRoundRoleTraceRows(trace);
        return {
            meta: buildRoundRoleTraceMeta({
                trace,
                getProfileModeLabel,
                normalizeNatureRandomModeOptions
            }),
            rows
        };
    }

    return {
        clearLatestSelectionTrace,
        getLatestSelectionTraceForCurrentSession,
        buildRoundRoleDebugFromSelectionTrace
    };
}
