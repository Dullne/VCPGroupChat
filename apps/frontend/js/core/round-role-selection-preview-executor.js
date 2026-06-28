import { createRoundRolePreviewContext } from './round-role-selection-preview-context.js';
import { buildRoundRoleSelectionMaps } from './round-role-selection-preview-selection-flow.js';
import { buildRoundRoleDebugPreviewResult } from './round-role-selection-preview-result-builder.js';

export function buildRoundRoleDebugPreviewForSelection(deps) {
    const {
        selectableRoles,
        getDom,
        getActiveSession,
        getAvailableRoles,
        getSelectedIncludeRoleIds,
        getPersistentlyMutedRoleNames,
        getExcludedRoleNamesForNextRound,
        getSessionProfile,
        getAutomaticParticipantRoles,
        getMentionedRoleIdsFromText,
        normalizeNatureRandomModeOptions,
        getDeterministicRandomInt,
        pickRandomSubsetDeterministic,
        getSortedRolesForPanel,
        getProfileModeLabel
    } = deps;

    const previewContext = createRoundRolePreviewContext({
        selectableRoles,
        getDom,
        getActiveSession,
        getAvailableRoles,
        getSelectedIncludeRoleIds,
        getPersistentlyMutedRoleNames,
        getExcludedRoleNamesForNextRound,
        getSessionProfile,
        getAutomaticParticipantRoles
    });
    const { baseCandidates } = buildRoundRoleSelectionMaps({
        ...previewContext,
        getMentionedRoleIdsFromText,
        normalizeNatureRandomModeOptions,
        getDeterministicRandomInt,
        pickRandomSubsetDeterministic
    });

    return buildRoundRoleDebugPreviewResult({
        selectedMap: previewContext.selectedMap,
        blockedMap: previewContext.blockedMap,
        sessionProfile: previewContext.sessionProfile,
        getSortedRolesForPanel,
        profileMode: previewContext.profileMode,
        baseCandidateCount: baseCandidates.length,
        getProfileModeLabel,
        normalizeNatureRandomModeOptions
    });
}
