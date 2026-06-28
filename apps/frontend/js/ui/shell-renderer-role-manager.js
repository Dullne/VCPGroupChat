import { syncLocalizedDom } from '../core/i18n.js';

export function renderShellRoleManager(deps) {
    const {
        renderWorkspaceMode,
        renderTeamList,
        renderCurrentTeamSummary,
        renderTeamFormStatus,
        renderTeamMemberPool,
        renderLauncherRolePicker,
        renderGroupProfileModeOptions,
        renderRoleStudio,
        renderGroupProfileList,
        renderCurrentProfileSummary,
        renderGroupMemberPool,
        renderGroupProfileFormStatus,
        renderRoleSelectionList,
        renderImportSourceList,
        renderSessionRoleList
    } = deps;

    const renderSteps = [
        ['workspace-mode', renderWorkspaceMode],
        ['team-list', renderTeamList],
        ['team-summary', renderCurrentTeamSummary],
        ['team-form-status', renderTeamFormStatus],
        ['team-member-pool', renderTeamMemberPool],
        ['launcher-role-picker', renderLauncherRolePicker],
        ['group-profile-mode-options', renderGroupProfileModeOptions],
        ['role-studio', renderRoleStudio],
        ['group-profile-list', renderGroupProfileList],
        ['current-profile-summary', renderCurrentProfileSummary],
        ['group-member-pool', renderGroupMemberPool],
        ['group-profile-form-status', renderGroupProfileFormStatus],
        ['role-selection-list', renderRoleSelectionList],
        ['import-source-list', renderImportSourceList],
        ['session-role-list', renderSessionRoleList]
    ];

    for (const [name, render] of renderSteps) {
        try {
            render();
        } catch (error) {
            console.error(`[renderRoleManager] ${name} failed`, error);
        }
    }

    syncLocalizedDom();
}
