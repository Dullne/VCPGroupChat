import { buildRoundRoleDebugPreviewForSelection } from './round-role-selection-preview-executor.js';

export function createRoundRoleSelectionPreviewBuilder(deps) {
    const {
        getDom,
        getSelectableRoles,
        getActiveSession,
        getAvailableRoles,
        getSelectedIncludeRoleIds,
        getPersistentlyMutedRoleNames,
        getExcludedRoleNamesForNextRound,
        getSessionProfile,
        getAutomaticParticipantRoles,
        getMentionedRoleIdsFromText,
        normalizeNatureRandomModeOptions,
        getDeterministicRandomInt,
        pickRandomSubsetDeterministic,
        getSortedRolesForPanel,
        getProfileModeLabel
    } = deps;

    function buildRoundRoleDebugPreview(selectableRoles = getSelectableRoles()) {
        return buildRoundRoleDebugPreviewForSelection({
            selectableRoles,
            getDom,
            getActiveSession,
            getAvailableRoles,
            getSelectedIncludeRoleIds,
            getPersistentlyMutedRoleNames,
            getExcludedRoleNamesForNextRound,
            getSessionProfile,
            getAutomaticParticipantRoles,
            getMentionedRoleIdsFromText,
            normalizeNatureRandomModeOptions,
            getDeterministicRandomInt,
            pickRandomSubsetDeterministic,
            getSortedRolesForPanel,
            getProfileModeLabel
        });
    }

    return {
        buildRoundRoleDebugPreview
    };
}
