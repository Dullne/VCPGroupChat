import {
    buildInviteOnlySummary,
    buildNatureRandomSummary,
    buildDefaultRoleSelectionSummary
} from './round-role-selection-summary-text.js';

export function resolveRoundRoleSelectionSummaryText(deps) {
    const {
        selectableRoles,
        selectedRoles,
        profileMode,
        sessionProfile,
        inputText,
        persistentlyMutedRoleNames,
        excludedRoleNamesForNextRound,
        getMentionedRoleIdsFromText,
        normalizeNatureRandomModeOptions,
        getAutomaticParticipantRoles
    } = deps;

    if (!selectableRoles.length) {
        return '当前会话暂无可点名角色。';
    }

    if (selectedRoles.length > 0) {
        return `已点名 ${selectedRoles.length} 位：${selectedRoles.map(role => role.name).join('、')}。发送后优先由这些角色参与。`;
    }

    if (profileMode === 'invite_only') {
        return buildInviteOnlySummary({
            inputText,
            selectableRoles,
            getMentionedRoleIdsFromText
        });
    }

    if (profileMode === 'naturerandom') {
        const modeOptions = normalizeNatureRandomModeOptions(sessionProfile?.mode_options || {});
        return buildNatureRandomSummary({
            inputText,
            persistentlyMutedRoleNames,
            excludedRoleNamesForNextRound,
            modeOptions,
            getAutomaticParticipantRoles,
            getMentionedRoleIdsFromText
        });
    }

    return buildDefaultRoleSelectionSummary(getAutomaticParticipantRoles);
}
