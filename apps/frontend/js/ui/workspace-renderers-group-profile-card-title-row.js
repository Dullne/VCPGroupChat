import { buildRoleBadgeContainer } from './role-card-ui.js';
import { buildWorkspaceGroupProfileBadges } from './workspace-renderers-group-profile-card-meta.js';

export function createWorkspaceGroupProfileCardTitleRow(deps) {
    const {
        profile,
        bootstrapData,
        managedProfile,
        sessionProfile,
        getProfileModeLabel
    } = deps;

    const titleRow = document.createElement('div');
    titleRow.className = 'role-card-title-row';

    const title = document.createElement('div');
    title.className = 'role-card-title';
    title.textContent = profile.name;

    const badges = buildRoleBadgeContainer(buildWorkspaceGroupProfileBadges(profile, {
        bootstrapData,
        managedProfile,
        sessionProfile,
        getProfileModeLabel
    }));

    titleRow.appendChild(title);
    titleRow.appendChild(badges);
    return titleRow;
}
