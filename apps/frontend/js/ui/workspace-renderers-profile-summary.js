import { applyWorkspaceProfileSummaryEmptyState } from './workspace-renderers-profile-summary-empty.js';
import { renderWorkspaceProfileSummaryDetails } from './workspace-renderers-profile-summary-details.js';

export function renderWorkspaceCurrentProfileSummary(deps) {
    const {
        getDom,
        getBootstrapData,
        getManagedProfile,
        getTeamById,
        summarizeInline,
        getProfileModeDetail,
        getProfileModeLabel,
        getSessionProfile,
        formatDateTime
    } = deps;

    const dom = getDom();
    const bootstrapData = getBootstrapData();
    const profile = getManagedProfile();

    if (!profile) {
        applyWorkspaceProfileSummaryEmptyState(dom);
        return;
    }

    renderWorkspaceProfileSummaryDetails({
        dom,
        profile,
        bootstrapData,
        getTeamById,
        summarizeInline,
        getProfileModeDetail,
        getProfileModeLabel,
        getSessionProfile,
        formatDateTime
    });
}
