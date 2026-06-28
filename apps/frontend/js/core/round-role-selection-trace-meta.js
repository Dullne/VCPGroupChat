export function buildRoundRoleTraceMeta(deps) {
    const {
        trace,
        getProfileModeLabel,
        normalizeNatureRandomModeOptions
    } = deps;

    const modeLabel = getProfileModeLabel(trace?.mode || 'sequential');
    const modeOptions = normalizeNatureRandomModeOptions(trace?.mode_options || {});
    const mentionedCount = Array.isArray(trace?.mentioned_role_ids) ? trace.mentioned_role_ids.length : 0;
    const selectedCount = Array.isArray(trace?.target_role_ids) ? trace.target_role_ids.length : 0;

    const modeMeta = [];
    if (String(trace?.mode || '') === 'naturerandom') {
        const mentionLabel = modeOptions.mention_mode === 'additive'
            ? '点名+随机补位'
            : modeOptions.mention_mode === 'ignore'
                ? '忽略点名'
                : '点名优先';
        modeMeta.push(`随机 ${modeOptions.random_min_speakers}-${modeOptions.random_max_speakers}`);
        modeMeta.push(mentionLabel);
        if (Number.isFinite(Number(trace?.random_target_count))) {
            modeMeta.push(`抽样目标 ${Number(trace.random_target_count)} 人`);
        }
    }

    return [
        `模式：${modeLabel}`,
        ...modeMeta,
        `点名 ${mentionedCount}`,
        `实际发言 ${selectedCount}`,
        '后端实绩'
    ].join(' · ');
}
