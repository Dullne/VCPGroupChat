import { buildRoundRoleSelectionCandidateSets } from './round-role-selection-preview-selection-flow-candidates.js';
import { applyRoundRoleSelectionMaps } from './round-role-selection-preview-selection-flow-apply.js';

export function buildRoundRoleSelectionMaps(deps) {
    const {
        activeSession,
        availableRoles,
        selectedIncludeRoleIds,
        persistentlyMutedRoleNames,
        excludedRoleNamesForNextRound,
        selectableRoleMap,
        sessionProfile,
        profileMode,
        inputText,
        automaticRoles,
        selectedMap,
        addSelectedReason,
        addBlockedReason,
        getMentionedRoleIdsFromText,
        normalizeNatureRandomModeOptions,
        getDeterministicRandomInt,
        pickRandomSubsetDeterministic
    } = deps;

    const {
        baseCandidates,
        includeRoleSet,
        mentionedSet
    } = buildRoundRoleSelectionCandidateSets({
        automaticRoles,
        persistentlyMutedRoleNames,
        excludedRoleNamesForNextRound,
        addBlockedReason,
        selectedIncludeRoleIds,
        selectableRoleMap,
        availableRoles,
        inputText,
        getMentionedRoleIdsFromText
    });

    applyRoundRoleSelectionMaps({
        baseCandidates,
        includeRoleSet,
        mentionedSet,
        profileMode,
        sessionProfile,
        activeSession,
        inputText,
        persistentlyMutedRoleNames,
        excludedRoleNamesForNextRound,
        addSelectedReason,
        normalizeNatureRandomModeOptions,
        getDeterministicRandomInt,
        pickRandomSubsetDeterministic,
        selectedIncludeRoleIds,
        selectableRoleMap,
        availableRoles,
        selectedMap,
        addBlockedReason,
        persistentlyMutedRoleNames,
        excludedRoleNamesForNextRound
    });

    return {
        baseCandidates
    };
}
