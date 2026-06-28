import { filterAllowedRoleIds } from './message-input-role-utils.js';
import {
    resolveInviteOnlyIncludeRoleIds,
    validateNatureRandomCandidates
} from './message-input-role-mode-checks.js';

export function resolveIncludeRoleIdsForMessage(deps) {
    const {
        text,
        availableRoles,
        sessionProfile,
        persistentlyMutedRoleNames,
        excludedRoleNamesForNextRound,
        selectedIncludeRoleIds,
        getMentionedRoleIdsFromText,
        getSelectableRoles,
        showToast,
        getAutomaticParticipantRoles
    } = deps;

    const profileMode = String(sessionProfile?.mode || 'sequential').trim().toLowerCase();
    let includeRoleIds = filterAllowedRoleIds([...selectedIncludeRoleIds], {
        availableRoles,
        persistentlyMutedRoleNames,
        excludedRoleNamesForNextRound
    });

    if (profileMode === 'invite_only' && includeRoleIds.length === 0) {
        const inviteOnlyRoleIds = resolveInviteOnlyIncludeRoleIds({
            text,
            availableRoles,
            persistentlyMutedRoleNames,
            excludedRoleNamesForNextRound,
            getMentionedRoleIdsFromText,
            getSelectableRoles,
            showToast
        });
        if (!inviteOnlyRoleIds) {
            return null;
        }
        includeRoleIds = inviteOnlyRoleIds;
    }

    if (profileMode === 'naturerandom') {
        const isValid = validateNatureRandomCandidates({
            getAutomaticParticipantRoles,
            persistentlyMutedRoleNames,
            excludedRoleNamesForNextRound,
            showToast
        });
        if (!isValid) {
            return null;
        }
    }

    if (selectedIncludeRoleIds.size > 0 && includeRoleIds.length === 0) {
        showToast('当前点名的角色都被禁言或已标记为本轮跳过', 'warning');
        return null;
    }

    return includeRoleIds;
}
