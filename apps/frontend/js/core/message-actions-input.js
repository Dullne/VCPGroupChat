import { createMessageInputUiHelpers } from './message-input-ui.js';
import { createMessageInputRolePayloadHelpers } from './message-input-role-payload.js';

export function createMessageInputHelpers(deps) {
    const uiHelpers = createMessageInputUiHelpers({
        getDom: deps.getDom,
        getSelectedImageBase64: deps.getSelectedImageBase64,
        setSelectedImageBase64: deps.setSelectedImageBase64
    });
    const rolePayloadHelpers = createMessageInputRolePayloadHelpers({
        getAvailableRoles: deps.getAvailableRoles,
        getSelectedIncludeRoleIds: deps.getSelectedIncludeRoleIds,
        getPersistentlyMutedRoleNames: deps.getPersistentlyMutedRoleNames,
        getExcludedRoleNamesForNextRound: deps.getExcludedRoleNamesForNextRound,
        getSessionProfile: deps.getSessionProfile,
        getSelectableRoles: deps.getSelectableRoles,
        getAutomaticParticipantRoles: deps.getAutomaticParticipantRoles,
        getMentionedRoleIdsFromText: deps.getMentionedRoleIdsFromText,
        showToast: deps.showToast
    });

    return {
        ...uiHelpers,
        ...rolePayloadHelpers
    };
}
