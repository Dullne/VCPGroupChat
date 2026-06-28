import { createShellRenderer } from '../ui/shell-renderer.js';

export function createRenderShellRenderer(deps) {
    const {
        getDom,
        getActiveSession,
        getSelectedProfileId,
        setSelectedProfileId,
        getSessions,
        switchSession,
        getBootstrapData,
        getProfileById,
        resolveManagedTeamId,
        setSelectedTeamId,
        formatDateTime,
        appendMessage,
        scrollToBottom,
        workspaceRenderers,
        renderGroupProfileModeOptions,
        renderRoleStudio,
        roundRoleSelectionRuntime,
        roleLibraryRuntime,
        updateFloatingRoleWindow,
        getAutomaticParticipantRoles
    } = deps;

    return createShellRenderer({
        getDom,
        getActiveSession,
        getSelectedProfileId,
        setSelectedProfileId,
        getSessions,
        switchSession,
        getBootstrapData,
        getProfileById,
        resolveManagedTeamId,
        setSelectedTeamId,
        formatDateTime,
        appendMessage,
        scrollToBottom,
        renderWorkspaceMode: (...args) => workspaceRenderers.renderWorkspaceMode(...args),
        renderTeamList: (...args) => workspaceRenderers.renderTeamList(...args),
        renderCurrentTeamSummary: (...args) => workspaceRenderers.renderCurrentTeamSummary(...args),
        renderTeamFormStatus: (...args) => workspaceRenderers.renderTeamFormStatus(...args),
        renderTeamMemberPool: (...args) => workspaceRenderers.renderTeamMemberPool(...args),
        renderLauncherRolePicker: (...args) => workspaceRenderers.renderLauncherRolePicker(...args),
        renderGroupProfileModeOptions,
        renderRoleStudio,
        renderGroupProfileList: (...args) => workspaceRenderers.renderGroupProfileList(...args),
        renderCurrentProfileSummary: (...args) => workspaceRenderers.renderCurrentProfileSummary(...args),
        renderGroupMemberPool: (...args) => workspaceRenderers.renderGroupMemberPool(...args),
        renderGroupProfileFormStatus: (...args) => workspaceRenderers.renderGroupProfileFormStatus(...args),
        renderRoleSelectionList: (...args) => roundRoleSelectionRuntime.renderRoleSelectionList(...args),
        renderImportSourceList: (...args) => roleLibraryRuntime.renderImportSourceList(...args),
        renderSessionRoleList: (...args) => roleLibraryRuntime.renderSessionRoleList(...args),
        updateFloatingRoleWindow,
        getAutomaticParticipantRoles
    });
}
