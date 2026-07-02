import { createAsyncActionButton, buildRoleBadgeContainer } from './role-card-ui.js';
import { formatRoleRuntimeModelBadge, getRoleRuntimeModelStatus } from '../core/model-preferences.js';
import { translateUiText } from '../core/i18n.js';

function getIdentityBadges(role) {
    const badges = [];
    if (role?.person_identity) {
        badges.push('长期人物', role.person_identity.display_name);
    }
    if (role?.runtime_binding_status === 'ready') {
        badges.push('运行时已连接');
    }
    if (role?.runtime_binding_status === 'missing_runtime') {
        badges.push('运行时缺失');
    }
    if (role?.runtime_binding_status === 'unbound_runtime') {
        badges.push('未绑定运行时');
    }
    if (role?.role_template_identity || role?.source === 'agency_agents') {
        badges.push('模板来源');
    }
    if (!badges.length) {
        badges.push('兼容角色');
    }
    return badges;
}

function canAddRoleToTeam(role) {
    return !role?.runtime_binding_status || role.runtime_binding_status === 'ready';
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
    const canAdd = canAddRoleToTeam(role);

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
    desc.textContent = role.person_identity?.description || role.description || role.persona || translateUiText('暂无人物描述');

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
        const addButton = createAsyncActionButton({
            label: canAdd ? addLabel : '先绑定运行时',
            handler: async () => {
                if (!canAdd) {
                    showToast('这个人物还没有连接可用运行时角色，请先绑定运行时能力', 'warning');
                    return;
                }
                await addRoleToTeam(role.id);
            },
            variant: canAdd ? 'primary' : 'secondary',
            showToast
        });
        addButton.disabled = !canAdd;
        actions.appendChild(addButton);
    }

    row.appendChild(titleRow);
    row.appendChild(desc);
    row.appendChild(actions);
    return row;
}
