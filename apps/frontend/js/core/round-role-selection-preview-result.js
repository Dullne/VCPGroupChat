export function buildRoundRoleDebugRows(deps) {
    const {
        selectedMap,
        blockedMap,
        sessionProfile,
        getSortedRolesForPanel
    } = deps;

    const selectedRolesSorted = getSortedRolesForPanel(
        [...selectedMap.values()].map(item => item.role),
        { profile: sessionProfile }
    );
    const blockedRolesSorted = getSortedRolesForPanel(
        [...blockedMap.values()].map(item => item.role),
        { profile: sessionProfile }
    );

    const selectedRows = selectedRolesSorted.map(role => ({
        role,
        status: 'selected',
        reasons: [...(selectedMap.get(role.id)?.reasons || [])]
    }));
    const blockedRows = blockedRolesSorted
        .filter(role => !selectedMap.has(role.id))
        .map(role => ({
            role,
            status: 'blocked',
            reasons: [...(blockedMap.get(role.id)?.reasons || [])]
        }));

    return [...selectedRows, ...blockedRows];
}

export function buildRoundRoleDebugMeta(deps) {
    const {
        profileMode,
        sessionProfile,
        baseCandidateCount,
        selectedCount,
        blockedCount,
        getProfileModeLabel,
        normalizeNatureRandomModeOptions
    } = deps;

    const modeParts = [`模式：${getProfileModeLabel(profileMode)}`];
    if (profileMode === 'naturerandom') {
        const modeOptions = normalizeNatureRandomModeOptions(sessionProfile?.mode_options || {});
        const mentionLabel = modeOptions.mention_mode === 'additive'
            ? '点名+随机补位'
            : modeOptions.mention_mode === 'ignore'
                ? '忽略点名'
                : '点名优先';
        modeParts.push(`随机 ${modeOptions.random_min_speakers}-${modeOptions.random_max_speakers}`);
        modeParts.push(mentionLabel);
    } else if (profileMode === 'sequential') {
        const rawSequentialLimit = Number(
            sessionProfile?.mode_options?.max_speakers_per_round
            ?? sessionProfile?.mode_options?.sequential_max_speakers
        );
        const sequentialLimit = Number.isFinite(rawSequentialLimit)
            ? Math.max(1, Math.min(4, Math.floor(rawSequentialLimit)))
            : 2;
        modeParts.push(`每轮 ${sequentialLimit}`);
    }
    modeParts.push(`候选 ${baseCandidateCount}`);
    modeParts.push(`预计发言 ${selectedCount}`);
    if (blockedCount > 0) {
        modeParts.push(`受限 ${blockedCount}`);
    }
    modeParts.push('前端预测');

    return modeParts.join(' · ');
}
