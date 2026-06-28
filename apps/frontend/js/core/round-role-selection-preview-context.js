import { createRoleReasonMapHelpers } from './round-role-selection-preview-maps.js';

export function createRoundRolePreviewContext(deps) {
    const {
        selectableRoles,
        getDom,
        getActiveSession,
        getAvailableRoles,
        getSelectedIncludeRoleIds,
        getPersistentlyMutedRoleNames,
        getExcludedRoleNamesForNextRound,
        getSessionProfile,
        getAutomaticParticipantRoles
    } = deps;

    const dom = getDom();
    const activeSession = getActiveSession();
    const availableRoles = getAvailableRoles();
    const selectedIncludeRoleIds = getSelectedIncludeRoleIds();
    const persistentlyMutedRoleNames = getPersistentlyMutedRoleNames();
    const excludedRoleNamesForNextRound = getExcludedRoleNamesForNextRound();
    const selectableRoleMap = new Map(selectableRoles.map(role => [role.id, role]));
    const sessionProfile = getSessionProfile();
    const profileMode = String(sessionProfile?.mode || 'sequential').trim().toLowerCase();
    const inputText = String(dom.messageInput?.value || '');
    const automaticRoles = getAutomaticParticipantRoles().filter(role => role.active !== false);
    const {
        blockedMap,
        selectedMap,
        addSelectedReason,
        addBlockedReason
    } = createRoleReasonMapHelpers();

    return {
        activeSession,
        availableRoles,
        selectedIncludeRoleIds,
        persistentlyMutedRoleNames,
        excludedRoleNamesForNextRound,
        selectableRoleMap,
        sessionProfile,
        profileMode,
        inputText,
        automaticRoles,
        blockedMap,
        selectedMap,
        addSelectedReason,
        addBlockedReason
    };
}
