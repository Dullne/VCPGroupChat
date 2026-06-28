export function applyNatureRandomPriorityMentionSelection(deps) {
    const {
        mentionMode,
        mentionedSet,
        baseCandidates,
        addSelectedReason
    } = deps;

    if (mentionMode !== 'priority' || mentionedSet.size <= 0) {
        return false;
    }

    for (const role of baseCandidates) {
        if (mentionedSet.has(role.id)) {
            addSelectedReason(role, '@点名');
        }
    }
    return true;
}

export function applyNatureRandomSingleCandidateSelection(deps) {
    const {
        baseCandidates,
        mentionMode,
        mentionedSet,
        addSelectedReason
    } = deps;

    if (baseCandidates.length !== 1) {
        return false;
    }

    const onlyRole = baseCandidates[0];
    if (mentionMode !== 'ignore' && mentionedSet.has(onlyRole.id)) {
        addSelectedReason(onlyRole, '@点名');
    } else {
        addSelectedReason(onlyRole, '随机抽样');
    }
    return true;
}
