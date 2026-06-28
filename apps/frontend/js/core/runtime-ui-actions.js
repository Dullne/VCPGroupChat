import { createFloatingRoleWindowUpdater } from './runtime-floating-role-window-action.js';
import { createRuntimeUiDomActions } from './runtime-ui-dom-actions.js';

export function createRuntimeUiActions(deps) {
    const {
        getDom,
        getBootstrapData,
        getAvailableRoles,
        getSelectedIncludeRoleIds,
        setSelectedIncludeRoleIds,
        appendChatMessage,
        buildAvatarDataUrl,
        escapeHtml,
        getMarkedRef
    } = deps;

    function pruneSelectedRoles() {
        const activeRoleIds = new Set(
            getAvailableRoles()
                .filter(role => role.active !== false)
                .map(role => role.id)
        );

        setSelectedIncludeRoleIds(
            new Set(
                [...getSelectedIncludeRoleIds()].filter(roleId => activeRoleIds.has(roleId))
            )
        );
    }

    const updateFloatingRoleWindow = createFloatingRoleWindowUpdater(deps);

    function appendMessage(target, message) {
        appendChatMessage({
            target,
            message,
            userName: getBootstrapData().user_name,
            buildAvatarDataUrl,
            escapeHtml,
            markedRef: getMarkedRef()
        });
    }

    const {
        toggleRoleManager,
        adjustTextareaHeight,
        scrollToBottom
    } = createRuntimeUiDomActions(deps);

    return {
        pruneSelectedRoles,
        updateFloatingRoleWindow,
        appendMessage,
        toggleRoleManager,
        adjustTextareaHeight,
        scrollToBottom
    };
}
