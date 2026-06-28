const DEFAULT_SEQUENTIAL_MAX_SPEAKERS = 2;

function applySelectionByRoleSet(baseCandidates, roleSet, reason, addSelectedReason) {
    for (const role of baseCandidates) {
        if (roleSet.has(role.id)) {
            addSelectedReason(role, reason);
        }
    }
}

export function applyIncludeSelection(baseCandidates, includeRoleSet, addSelectedReason) {
    applySelectionByRoleSet(baseCandidates, includeRoleSet, '手动点名', addSelectedReason);
}

export function applyInviteOnlySelection(baseCandidates, mentionedSet, addSelectedReason) {
    applySelectionByRoleSet(baseCandidates, mentionedSet, '@点名', addSelectedReason);
}

export function applyMentionedSelection(baseCandidates, mentionedSet, addSelectedReason) {
    applySelectionByRoleSet(baseCandidates, mentionedSet, '@点名', addSelectedReason);
}

function normalizeSequentialMaxSpeakers(sessionProfile = {}) {
    const rawValue = Number(
        sessionProfile?.mode_options?.max_speakers_per_round
        ?? sessionProfile?.mode_options?.sequential_max_speakers
    );
    if (!Number.isFinite(rawValue)) {
        return DEFAULT_SEQUENTIAL_MAX_SPEAKERS;
    }
    return Math.max(1, Math.min(4, Math.floor(rawValue)));
}

function resolveNextRoundIndex(activeSession = {}) {
    const lastRoundIndex = Number(activeSession?.messages?.at?.(-1)?.round_index || 0);
    return Math.max(1, lastRoundIndex + 1);
}

function pickSequentialWindow(baseCandidates, maxSpeakers, roundIndex) {
    const normalizedMaxSpeakers = Math.max(
        1,
        Math.min(baseCandidates.length || 1, Number(maxSpeakers || DEFAULT_SEQUENTIAL_MAX_SPEAKERS))
    );

    if (baseCandidates.length <= normalizedMaxSpeakers) {
        return baseCandidates;
    }

    const normalizedRoundIndex = Math.max(1, Math.floor(Number(roundIndex) || 1));
    const startIndex = ((normalizedRoundIndex - 1) * normalizedMaxSpeakers) % baseCandidates.length;

    return Array.from({ length: normalizedMaxSpeakers }, (_, index) =>
        baseCandidates[(startIndex + index) % baseCandidates.length]
    );
}

export function applyDefaultSelection(baseCandidates, addSelectedReason, options = {}) {
    const maxSpeakersPerRound = normalizeSequentialMaxSpeakers(options.sessionProfile);
    const roundIndex = resolveNextRoundIndex(options.activeSession);
    const selectedRoles = pickSequentialWindow(baseCandidates, maxSpeakersPerRound, roundIndex);

    for (const role of selectedRoles) {
        addSelectedReason(role, '顺序轮转');
        addSelectedReason(role, `每轮最多 ${maxSpeakersPerRound} 位`);
    }
}
