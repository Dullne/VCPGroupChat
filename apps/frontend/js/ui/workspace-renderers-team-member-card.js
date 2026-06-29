import { createAsyncActionButton, buildRoleBadgeContainer } from './role-card-ui.js';
import { formatRoleRuntimeModelBadge, getRoleRuntimeModelStatus } from '../core/model-preferences.js';
import { translateUiText } from '../core/i18n.js';

function getIdentityBadges(role) {
    const badges = [];
    if (role?.person_identity) {
        badges.push('长期人物', role.person_identity.display_name);
    }
    if (role?.role_template_identity || role?.source === 'agency_agents') {
        badges.push('模板来源');
    }
    if (!badges.length) {
        badges.push('兼容角色');
    }
    return badges;
}

export function createWorkspaceTeamMemberCard(deps) {
    const {
        role,
        bootstrapData,
        isRoleInManagedTeam,
        addRoleToTeam,
        removeRoleFromTeam,
        showToast,
        selectedLabel = '已在团队',
        availableLabel = '未进团队',
        addLabel = '加入这个团队',
        removeLabel = '移出团队'
    } = deps;
    const isSelected = isRoleInManagedTeam(role.id);

    const row = document.createElement('div');
    row.className = 'role-card';
    row.classList.add(isSelected
        ? 'team-member-card-in-team'
        : 'team-member-card-available');

    const titleRow = document.createElement('div');
    titleRow.className = 'role-card-title-row';
    const title = document.createElement('div');
    title.className = 'role-card-title';
    title.textContent = role.person_identity?.display_name || role.name || role.id;
    titleRow.appendChild(title);
    const runtimeModelStatus = getRoleRuntimeModelStatus(role, bootstrapData);
    titleRow.appendChild(buildRoleBadgeContainer([
        isSelected ? selectedLabel : availableLabel,
        ...getIdentityBadges(role),
        role.is_native ? '原生' : '可编辑',
        runtimeModelStatus.model ? formatRoleRuntimeModelBadge(role, bootstrapData) : null,
        runtimeModelStatus.disabled ? '运行时回退' : null
    ]));

    const desc = document.createElement('div');
    desc.className = 'role-card-description';
    desc.textContent = role.description || role.persona || translateUiText('暂无角色描述');

    const actions = document.createElement('div');
    actions.className = 'role-card-actions';

    if (isSelected) {
        actions.appendChild(createAsyncActionButton({
            label: removeLabel,
            handler: async () => {
                await removeRoleFromTeam(role.id);
            },
            variant: 'secondary',
            showToast
        }));
    } else {
        actions.appendChild(createAsyncActionButton({
            label: addLabel,
            handler: async () => {
                await addRoleToTeam(role.id);
            },
            showToast
        }));
    }

    row.appendChild(titleRow);
    row.appendChild(desc);
    row.appendChild(actions);
    return row;
}
