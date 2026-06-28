export function normalizeNatureRandomModeOptions(rawOptions = {}) {
    const source = rawOptions && typeof rawOptions === 'object' ? rawOptions : {};
    const mentionMode = ['priority', 'additive', 'ignore'].includes(String(source.mention_mode || '').trim())
        ? String(source.mention_mode).trim()
        : 'priority';
    const minRaw = Number(source.random_min_speakers);
    const maxRaw = Number(source.random_max_speakers);
    const min = Number.isFinite(minRaw) ? Math.max(1, Math.min(6, Math.floor(minRaw))) : 2;
    const max = Number.isFinite(maxRaw) ? Math.max(1, Math.min(8, Math.floor(maxRaw))) : 3;

    return {
        mention_mode: mentionMode,
        random_min_speakers: Math.min(min, max),
        random_max_speakers: Math.max(min, max)
    };
}

export function getProfileModeLabel(mode) {
    const normalized = String(mode || '').trim().toLowerCase();
    if (normalized === 'invite_only') {
        return '邀请制';
    }
    if (normalized === 'naturerandom') {
        return '自然随机';
    }
    return '顺序协作';
}

export function getProfileModeDetail(profile) {
    const mode = String(profile?.mode || '').trim().toLowerCase();
    if (mode !== 'naturerandom') {
        return '';
    }

    const options = normalizeNatureRandomModeOptions(profile?.mode_options || {});
    const mentionLabel = options.mention_mode === 'additive'
        ? '点名+随机补位'
        : options.mention_mode === 'ignore'
            ? '忽略点名'
            : '点名优先';
    return `${options.random_min_speakers}-${options.random_max_speakers}人 · ${mentionLabel}`;
}

export function formatProfileOptionLabel(profile) {
    const memberCount = (profile.members || []).filter(member => member.enabled).length;
    const modeLabel = getProfileModeLabel(profile.mode);
    const modeDetail = getProfileModeDetail(profile);
    return `${profile.name} · ${modeLabel}${modeDetail ? `(${modeDetail})` : ''} · ${memberCount} 人 · ${Number(profile.session_count || 0)} 会话`;
}
