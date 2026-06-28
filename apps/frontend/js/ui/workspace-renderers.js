import { renderWorkspaceModeView } from './workspace-renderers-mode.js';
import {
    renderWorkspaceTeamList,
    renderWorkspaceCurrentTeamSummary,
    renderWorkspaceTeamFormStatus
} from './workspace-renderers-team.js';
import { renderWorkspaceTeamMemberPool } from './workspace-renderers-team-member-pool.js';
import { renderWorkspaceGroupMemberPool } from './workspace-renderers-group-member-pool.js';
import { renderWorkspaceLauncherRolePicker } from './workspace-renderers-launcher-role-picker.js';
import { renderWorkspaceGroupProfileList } from './workspace-renderers-group-profile-list.js';
import { renderWorkspaceCurrentProfileSummary } from './workspace-renderers-profile-summary.js';
import { renderWorkspaceGroupProfileFormStatus } from './workspace-renderers-group-profile-form-status.js';
import { buildWorkspaceRendererDepsBundles } from './workspace-renderers-deps.js';

export function createWorkspaceRenderers(deps) {
    const {
        modeDeps,
        teamListDeps,
        teamSummaryDeps,
        teamFormStatusDeps,
        teamMemberPoolDeps,
        launcherRolePickerDeps,
        groupMemberPoolDeps,
        groupProfileListDeps,
        currentProfileSummaryDeps,
        groupProfileFormStatusDeps
    } = buildWorkspaceRendererDepsBundles(deps);

    return {
        renderWorkspaceMode: () => renderWorkspaceModeView(modeDeps),
        renderTeamList: () => renderWorkspaceTeamList(teamListDeps),
        renderCurrentTeamSummary: () => renderWorkspaceCurrentTeamSummary(teamSummaryDeps),
        renderTeamFormStatus: () => renderWorkspaceTeamFormStatus(teamFormStatusDeps),
        renderTeamMemberPool: () => renderWorkspaceTeamMemberPool(teamMemberPoolDeps),
        renderLauncherRolePicker: () => renderWorkspaceLauncherRolePicker(launcherRolePickerDeps),
        renderGroupMemberPool: () => renderWorkspaceGroupMemberPool(groupMemberPoolDeps),
        renderGroupProfileList: () => renderWorkspaceGroupProfileList(groupProfileListDeps),
        renderCurrentProfileSummary: () => renderWorkspaceCurrentProfileSummary(currentProfileSummaryDeps),
        renderGroupProfileFormStatus: () => renderWorkspaceGroupProfileFormStatus(groupProfileFormStatusDeps)
    };
}
