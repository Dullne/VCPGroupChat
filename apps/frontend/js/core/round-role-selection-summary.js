import { applyRoleSelectionSummaryControlState } from './round-role-selection-summary-controls.js';
import { renderCognitiveInspector } from './cognitive-inspector-renderer.js';
import { resolveRoundRoleSelectionSummaryText } from './round-role-selection-summary-text-resolver.js';

export function createRoundRoleSelectionSummaryRenderer(deps) {
    const {
        getDom,
        getActiveSession,
        getSelectableRoles,
        getSelectedIncludeRoleIds,
        getPersistentlyMutedRoleNames,
        getExcludedRoleNamesForNextRound,
        getSessionProfile,
        getRoleSelectionExpanded,
        getMentionedRoleIdsFromText,
        normalizeNatureRandomModeOptions,
        getAutomaticParticipantRoles,
        getProfileModeLabel,
        getProfileModeDetail,
        getLatestSelectionTraceForCurrentSession,
        getMemoryReflection,
        getMemoryCandidates,
        getMemoryIndexRepair,
        getBootstrapData,
        buildRoundRoleDebugFromSelectionTrace,
        buildRoundRoleDebugPreview,
        renderRoundRoleDebug
    } = deps;

    function renderRoleSelectionSummary(selectableRoles = getSelectableRoles()) {
        const dom = getDom();
        const selectedIncludeRoleIds = getSelectedIncludeRoleIds();
        const persistentlyMutedRoleNames = getPersistentlyMutedRoleNames();
        const excludedRoleNamesForNextRound = getExcludedRoleNamesForNextRound();
        const selectedRoles = selectableRoles.filter(role => selectedIncludeRoleIds.has(role.id));
        const sessionProfile = getSessionProfile();
        const profileMode = String(sessionProfile?.mode || 'sequential').trim().toLowerCase();
        const automaticRoles = getAutomaticParticipantRoles();

        applyRoleSelectionSummaryControlState({
            dom,
            hasSelectableRoles: selectableRoles.length > 0,
            hasSelectedRoles: selectedRoles.length > 0,
            expanded: getRoleSelectionExpanded()
        });
        dom.roundRoleSummary.textContent = resolveRoundRoleSelectionSummaryText({
            selectableRoles,
            selectedRoles,
            profileMode,
            sessionProfile,
            inputText: dom.messageInput?.value || '',
            persistentlyMutedRoleNames,
            excludedRoleNamesForNextRound,
            getMentionedRoleIdsFromText,
            normalizeNatureRandomModeOptions,
            getAutomaticParticipantRoles: () => automaticRoles
        });
        renderCognitiveInspector({
            dom,
            sessionProfile,
            selectedRoles,
            automaticRoles,
            getProfileModeLabel,
            getProfileModeDetail,
            latestSelectionTrace: getLatestSelectionTraceForCurrentSession?.() || null,
            memoryReflection: getMemoryReflection?.() || null,
            memoryCandidates: getMemoryCandidates?.() || [],
            memoryIndexRepair: getMemoryIndexRepair?.() || null,
            activeSession: getActiveSession?.() || null,
            bootstrapData: getBootstrapData?.() || null,
            runtimePreview: buildRoundRoleDebugPreview?.(selectableRoles) || null,
            buildRoundRoleDebugFromSelectionTrace
        });
        renderRoundRoleDebug(selectableRoles);
    }

    return {
        renderRoleSelectionSummary
    };
}
