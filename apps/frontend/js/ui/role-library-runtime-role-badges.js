import { state } from '../core/state.js';
import { formatRoleRuntimeModelBadge, getRoleRuntimeModelStatus } from '../core/model-preferences.js';

export function buildRoleLibraryRoleBadges(role, deps) {
    const {
        isRoleInManagedTeam,
        isRoleInManagedProfile,
        getManagedProfileMemberPosition
    } = deps;

    const badges = [];
    if (role.source === 'person') {
        badges.push('长期人物');
    } else {
        badges.push(role.source === 'ephemeral' ? '临时角色' : '运行时角色');
    }
    if (role.runtime_binding_status === 'ready') {
        badges.push('运行时已连接');
    }
    if (role.runtime_binding_status === 'missing_runtime') {
        badges.push('运行时缺失');
    }
    if (role.runtime_binding_status === 'unbound_runtime') {
        badges.push('未绑定运行时');
    }
    if (role.is_native) {
        badges.push('原生模板');
    }
    const runtimeModelStatus = getRoleRuntimeModelStatus(role, state.bootstrapData);
    if (runtimeModelStatus.model) {
        badges.push(formatRoleRuntimeModelBadge(role, state.bootstrapData));
        if (runtimeModelStatus.disabled) {
            badges.push('运行时回退');
        }
    }
    if (isRoleInManagedTeam(role.id)) {
        badges.push('团队成员');
    }
    if (isRoleInManagedProfile(role.id)) {
        badges.push('群组成员');
        const position = getManagedProfileMemberPosition(role.id);
        if (position > 0) {
            badges.push(`第 ${position} 位`);
        }
    }
    if (role.promoted_core_role_id) {
        badges.push('已长期化');
    }
    return badges;
}
