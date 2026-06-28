import { buildExcludedRoleIdsFromAutomaticRoles } from './message-input-role-excluded-builder.js';
import { resolveIncludeRoleIdsForMessage } from './message-input-role-include-resolver.js';

export function createMessageInputRolePayloadHelpers(deps) {
    const {
        getAvailableRoles,
        getSelectedIncludeRoleIds,
        getPersistentlyMutedRoleNames,
        getExcludedRoleNamesForNextRound,
        getSessionProfile,
        getSelectableRoles,
        getAutomaticParticipantRoles,
        getMentionedRoleIdsFromText,
        showToast
    } = deps;

    function buildExcludedRoleIds() {
        return buildExcludedRoleIdsFromAutomaticRoles({
            automaticRoles: getAutomaticParticipantRoles(),
            persistentlyMutedRoleNames: getPersistentlyMutedRoleNames(),
            excludedRoleNamesForNextRound: getExcludedRoleNamesForNextRound()
        });
    }

    function resolveIncludeRoleIds(text) {
        return resolveIncludeRoleIdsForMessage({
            text,
            availableRoles: getAvailableRoles(),
            sessionProfile: getSessionProfile(),
            persistentlyMutedRoleNames: getPersistentlyMutedRoleNames(),
            excludedRoleNamesForNextRound: getExcludedRoleNamesForNextRound(),
            selectedIncludeRoleIds: getSelectedIncludeRoleIds(),
            getMentionedRoleIdsFromText,
            getSelectableRoles,
            showToast,
            getAutomaticParticipantRoles
        });
    }

    return {
        buildExcludedRoleIds,
        resolveIncludeRoleIds
    };
}
