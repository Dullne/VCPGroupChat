export function buildInviteOnlySummary(deps) {
    const {
        inputText,
        selectableRoles,
        getMentionedRoleIdsFromText
    } = deps;

    const mentioned = [...getMentionedRoleIdsFromText(inputText, selectableRoles)]
        .map(roleId => selectableRoles.find(role => role.id === roleId))
        .filter(Boolean);
    return mentioned.length > 0
        ? `当前群组为邀请制：已识别消息点名 ${mentioned.map(role => role.name).join('、')}，发送后仅这些角色发言。`
        : '当前群组为邀请制发言：请勾选点名，或在消息里使用 @角色名/@tag。';
}

export function buildNatureRandomSummary(deps) {
    const {
        inputText,
        persistentlyMutedRoleNames,
        excludedRoleNamesForNextRound,
        modeOptions,
        getAutomaticParticipantRoles,
        getMentionedRoleIdsFromText
    } = deps;

    const automaticRoles = getAutomaticParticipantRoles().filter(role =>
        !persistentlyMutedRoleNames.has(role.name) &&
        !excludedRoleNamesForNextRound.has(role.name)
    );
    const mentioned = [...getMentionedRoleIdsFromText(inputText, automaticRoles)]
        .map(roleId => automaticRoles.find(role => role.id === roleId))
        .filter(Boolean);
    if (modeOptions.mention_mode !== 'ignore' && mentioned.length > 0) {
        const mentionStrategyText = modeOptions.mention_mode === 'additive'
            ? '点名+随机补位'
            : '点名优先';
        if (mentionStrategyText === '点名+随机补位') {
            return `自然随机模式检测到点名：${mentioned.map(role => role.name).join('、')}，本轮按“${mentionStrategyText}”策略执行。`;
        }
        return `自然随机模式检测到点名：${mentioned.map(role => role.name).join('、')}，本轮将优先这些角色发言。`;
    }

    const count = automaticRoles.length;
    if (!count) {
        return '自然随机模式下当前没有可用角色。';
    }

    const min = Math.min(modeOptions.random_min_speakers, count);
    const max = Math.min(modeOptions.random_max_speakers, count);
    const mentionText = modeOptions.mention_mode === 'ignore'
        ? '忽略点名'
        : modeOptions.mention_mode === 'additive'
            ? '点名+随机补位'
            : '点名优先';
    return `当前为自然随机模式：从 ${count} 位可用角色中随机 ${min}-${max} 位发言（${mentionText}）。`;
}

export function buildDefaultRoleSelectionSummary(getAutomaticParticipantRoles) {
    const automaticRoles = getAutomaticParticipantRoles();
    return automaticRoles.length
        ? `当前未点名时，会按顺序轮转让候选角色参与，每轮最多 2 位。当前候选池包含：${automaticRoles.map(role => role.name).join('、')}。`
        : '当前未点名，发送时不会有默认参与角色。';
}
