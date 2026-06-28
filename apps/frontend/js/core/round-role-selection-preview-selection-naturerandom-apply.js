export function applyNatureRandomAdditiveSelection(deps) {
    const {
        baseCandidates,
        mentionedSet,
        targetCount,
        seedBase,
        addSelectedReason,
        pickRandomSubsetDeterministic
    } = deps;

    const mentionedRoles = baseCandidates.filter(role => mentionedSet.has(role.id));
    if (mentionedRoles.length >= targetCount) {
        for (const role of mentionedRoles.slice(0, targetCount)) {
            addSelectedReason(role, '@点名');
        }
        return;
    }

    for (const role of mentionedRoles) {
        addSelectedReason(role, '@点名');
    }
    const nonMentionedRoles = baseCandidates.filter(role => !mentionedSet.has(role.id));
    const extraRoles = pickRandomSubsetDeterministic(
        nonMentionedRoles,
        targetCount - mentionedRoles.length,
        `${seedBase}|extra`
    );
    for (const role of extraRoles) {
        addSelectedReason(role, '随机补位');
    }
}

export function applyNatureRandomSampledSelection(deps) {
    const {
        baseCandidates,
        targetCount,
        seedBase,
        addSelectedReason,
        pickRandomSubsetDeterministic
    } = deps;

    const sampledRoles = pickRandomSubsetDeterministic(
        baseCandidates,
        targetCount,
        `${seedBase}|sample`
    );
    for (const role of sampledRoles) {
        addSelectedReason(role, '随机抽样');
    }
}
