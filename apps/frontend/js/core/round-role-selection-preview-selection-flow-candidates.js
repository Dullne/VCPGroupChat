import {
    buildRoundRoleBaseCandidates,
    buildRoundRoleIncludeRoleSet
} from './round-role-selection-preview-candidates.js';

export function buildRoundRoleSelectionCandidateSets(deps) {
    const {
        automaticRoles,
        persistentlyMutedRoleNames,
        excludedRoleNamesForNextRound,
        addBlockedReason,
        selectedIncludeRoleIds,
        selectableRoleMap,
        availableRoles,
        inputText,
        getMentionedRoleIdsFromText
    } = deps;

    const baseCandidates = buildRoundRoleBaseCandidates({
        automaticRoles,
        persistentlyMutedRoleNames,
        excludedRoleNamesForNextRound,
        addBlockedReason
    });
    const includeRoleSet = buildRoundRoleIncludeRoleSet({
        selectedIncludeRoleIds,
        selectableRoleMap,
        availableRoles,
        persistentlyMutedRoleNames,
        excludedRoleNamesForNextRound
    });
    const mentionedSet = getMentionedRoleIdsFromText(inputText, baseCandidates);

    return {
        baseCandidates,
        includeRoleSet,
        mentionedSet
    };
}
