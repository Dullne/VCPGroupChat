import {
    filterAllowedRoleIds,
    countAutomaticCandidates
} from './message-input-role-utils.js';

export function resolveInviteOnlyIncludeRoleIds(deps) {
    const {
        text,
        availableRoles,
        persistentlyMutedRoleNames,
        excludedRoleNamesForNextRound,
        getMentionedRoleIdsFromText,
        getSelectableRoles,
        showToast
    } = deps;

    const mentionedRoleIds = filterAllowedRoleIds(
        [...getMentionedRoleIdsFromText(text, getSelectableRoles())],
        {
            availableRoles,
            persistentlyMutedRoleNames,
            excludedRoleNamesForNextRound
        }
    );

    if (mentionedRoleIds.length === 0) {
        showToast('当前群组是邀请制发言，请点名角色或在消息里使用 @角色名/@tag', 'warning');
        return null;
    }

    return mentionedRoleIds;
}

export function validateNatureRandomCandidates(deps) {
    const {
        getAutomaticParticipantRoles,
        persistentlyMutedRoleNames,
        excludedRoleNamesForNextRound,
        showToast
    } = deps;

    const candidateCount = countAutomaticCandidates({
        automaticRoles: getAutomaticParticipantRoles(),
        persistentlyMutedRoleNames,
        excludedRoleNamesForNextRound
    });

    if (candidateCount === 0) {
        showToast('当前自然随机模式下没有可发言角色，请先恢复角色或调整群组成员', 'warning');
        return false;
    }

    return true;
}
