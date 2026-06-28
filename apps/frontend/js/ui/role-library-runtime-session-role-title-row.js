import { buildRoleBadgeContainer } from './role-card-ui.js';
import { buildRoleLibraryRoleBadges } from './role-library-runtime-role-badges.js';

export function createRoleLibrarySessionRoleTitleRow(role, deps) {
    const {
        isRoleInManagedTeam,
        isRoleInManagedProfile,
        getManagedProfileMemberPosition
    } = deps;

    const titleRow = document.createElement('div');
    titleRow.className = 'role-card-title-row';

    const title = document.createElement('div');
    title.className = 'role-card-title';
    title.textContent = role.name;
    titleRow.appendChild(title);
    titleRow.appendChild(buildRoleBadgeContainer(buildRoleLibraryRoleBadges(role, {
        isRoleInManagedTeam,
        isRoleInManagedProfile,
        getManagedProfileMemberPosition
    })));

    return titleRow;
}
