import { applyRoundRoleSelectionByMode } from './round-role-selection-preview-selection.js';
import { markRoundRoleSelectionBlockedItems } from './round-role-selection-preview-blocked.js';

export function applyRoundRoleSelectionMaps(deps) {
    const {
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
        addBlockedReason
    } = deps;

    applyRoundRoleSelectionByMode({
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
        pickRandomSubsetDeterministic
    });

    markRoundRoleSelectionBlockedItems({
        selectedIncludeRoleIds,
        selectableRoleMap,
        availableRoles,
        persistentlyMutedRoleNames,
        excludedRoleNamesForNextRound,
        baseCandidates,
        selectedMap,
        addBlockedReason
    });
}
