import {
    buildNatureRandomSelectionSeed,
    applyNatureRandomAdditiveSelection,
    applyNatureRandomSampledSelection
} from './round-role-selection-preview-selection-naturerandom-utils.js';

export function applyNatureRandomSeededSelection(deps) {
    const {
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
    } = deps;

    const { seedBase, targetCount } = buildNatureRandomSelectionSeed({
        baseCandidates,
        modeOptions,
        mentionMode,
        activeSession,
        sessionProfile,
        inputText,
        includeRoleSet,
        persistentlyMutedRoleNames,
        excludedRoleNamesForNextRound,
        getDeterministicRandomInt
    });

    if (mentionMode === 'additive' && mentionedSet.size > 0) {
        applyNatureRandomAdditiveSelection({
            baseCandidates,
            mentionedSet,
            targetCount,
            seedBase,
            addSelectedReason,
            pickRandomSubsetDeterministic
        });
        return;
    }

    applyNatureRandomSampledSelection({
        baseCandidates,
        targetCount,
        seedBase,
        addSelectedReason,
        pickRandomSubsetDeterministic
    });
}
