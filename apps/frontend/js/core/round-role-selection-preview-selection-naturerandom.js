import {
    applyNatureRandomPriorityMentionSelection,
    applyNatureRandomSingleCandidateSelection
} from './round-role-selection-preview-selection-naturerandom-guards.js';
import { applyNatureRandomSeededSelection } from './round-role-selection-preview-selection-naturerandom-seeded.js';

export function applyNatureRandomSelection(deps) {
    const {
        baseCandidates,
        includeRoleSet,
        mentionedSet,
        sessionProfile,
        activeSession,
        inputText,
        persistentlyMutedRoleNames,
        excludedRoleNamesForNextRound,
        addSelectedReason,
        normalizeNatureRandomModeOptions,
        getDeterministicRandomInt,
        pickRandomSubsetDeterministic
    } = deps;

    const modeOptions = normalizeNatureRandomModeOptions(sessionProfile?.mode_options || {});
    const mentionMode = modeOptions.mention_mode;

    if (applyNatureRandomPriorityMentionSelection({
        mentionMode,
        mentionedSet,
        baseCandidates,
        addSelectedReason
    })) {
        return;
    }

    if (applyNatureRandomSingleCandidateSelection({
        baseCandidates,
        mentionMode,
        mentionedSet,
        addSelectedReason
    })) {
        return;
    }

    if (baseCandidates.length <= 1) {
        return;
    }

    applyNatureRandomSeededSelection({
        baseCandidates,
        includeRoleSet,
        mentionedSet,
        modeOptions,
        mentionMode,
        sessionProfile,
        activeSession,
        inputText,
        persistentlyMutedRoleNames,
        excludedRoleNamesForNextRound,
        addSelectedReason,
        getDeterministicRandomInt,
        pickRandomSubsetDeterministic
    });
}
