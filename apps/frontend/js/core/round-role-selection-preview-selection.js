import { applyNatureRandomSelection } from './round-role-selection-preview-selection-naturerandom.js';
import {
    applyIncludeSelection,
    applyInviteOnlySelection,
    applyMentionedSelection,
    applyDefaultSelection
} from './round-role-selection-preview-selection-basic.js';

export function applyRoundRoleSelectionByMode(deps) {
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
        pickRandomSubsetDeterministic
    } = deps;

    if (includeRoleSet.size > 0) {
        applyIncludeSelection(baseCandidates, includeRoleSet, addSelectedReason);
        return;
    }

    if (profileMode === 'invite_only') {
        applyInviteOnlySelection(baseCandidates, mentionedSet, addSelectedReason);
        return;
    }

    if (profileMode === 'naturerandom') {
        applyNatureRandomSelection({
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
        });
        return;
    }

    if (mentionedSet.size > 0) {
        applyMentionedSelection(baseCandidates, mentionedSet, addSelectedReason);
        return;
    }

    applyDefaultSelection(baseCandidates, addSelectedReason, {
        sessionProfile,
        activeSession
    });
}
