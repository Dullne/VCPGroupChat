import {
    buildRoundRoleDebugRows,
    buildRoundRoleDebugMeta
} from './round-role-selection-preview-result.js';

export function buildRoundRoleDebugPreviewResult(deps) {
    const {
        selectedMap,
        blockedMap,
        sessionProfile,
        getSortedRolesForPanel,
        profileMode,
        baseCandidateCount,
        getProfileModeLabel,
        normalizeNatureRandomModeOptions
    } = deps;

    const rows = buildRoundRoleDebugRows({
        selectedMap,
        blockedMap,
        sessionProfile,
        getSortedRolesForPanel
    });
    const selectedCount = rows.filter(row => row.status === 'selected').length;
    const blockedCount = rows.filter(row => row.status === 'blocked').length;
    const meta = buildRoundRoleDebugMeta({
        profileMode,
        sessionProfile,
        baseCandidateCount,
        selectedCount,
        blockedCount,
        getProfileModeLabel,
        normalizeNatureRandomModeOptions
    });

    return {
        meta,
        rows
    };
}
