import { createRuntimeUiActions } from './runtime-ui-actions.js';

export function createRenderShellRuntimeUiActions(deps) {
    const {
        getDom,
        getBootstrapData,
        getAvailableRoles,
        getSelectedIncludeRoleIds,
        setSelectedIncludeRoleIds,
        getPersistentlyMutedRoleNames,
        getExcludedRoleNamesForNextRound,
        saveMutedRoleNames,
        clearLatestSelectionTrace,
        renderRoleSelectionSummary,
        renderFloatingRoleWindow,
        appendChatMessage,
        toggleModalOpen,
        adjustTextareaHeightDom,
        scrollToBottomDom,
        buildAvatarDataUrl,
        escapeHtml
    } = deps;

    return createRuntimeUiActions({
        getDom,
        getBootstrapData,
        getAvailableRoles,
        getSelectedIncludeRoleIds,
        setSelectedIncludeRoleIds,
        getPersistentlyMutedRoleNames,
        getExcludedRoleNamesForNextRound,
        saveMutedRoleNames,
        clearLatestSelectionTrace,
        renderRoleSelectionSummary,
        renderFloatingRoleWindow,
        appendChatMessage,
        toggleModalOpen,
        adjustTextareaHeightDom,
        scrollToBottomDom,
        buildAvatarDataUrl,
        escapeHtml,
        getMarkedRef: () => (typeof marked !== 'undefined' ? marked : null)
    });
}
