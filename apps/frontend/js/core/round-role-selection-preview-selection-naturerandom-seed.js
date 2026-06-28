export function buildNatureRandomSelectionSeed(deps) {
    const {
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
    } = deps;

    const min = Math.min(modeOptions.random_min_speakers, baseCandidates.length);
    const max = Math.min(modeOptions.random_max_speakers, baseCandidates.length);
    const seedBase = [
        activeSession?.id || '',
        sessionProfile?.id || '',
        inputText,
        [...includeRoleSet].sort().join(','),
        [...persistentlyMutedRoleNames].sort().join(','),
        [...excludedRoleNamesForNextRound].sort().join(','),
        mentionMode,
        String(min),
        String(max),
        baseCandidates.map(role => role.id).join(',')
    ].join('|');
    const targetCount = Math.max(
        1,
        Math.min(
            baseCandidates.length,
            getDeterministicRandomInt(min, max, `${seedBase}|count`)
        )
    );

    return { seedBase, targetCount };
}
