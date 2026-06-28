export function buildRoleDetailPath(roleId, sessionId = '') {
    const query = String(sessionId || '').trim()
        ? `?session_id=${encodeURIComponent(sessionId)}`
        : '';
    return `/api/roles/${encodeURIComponent(roleId)}${query}`;
}

function mergeRoleList(roles = [], detail) {
    if (!Array.isArray(roles) || !detail?.id) {
        return Array.isArray(roles) ? roles : [];
    }
    return roles.map(role => (role?.id === detail.id ? detail : role));
}

export function mergeRoleDetailIntoRoleLists(state, detail) {
    if (!state || !detail?.id) {
        return detail;
    }

    state.availableRoles = mergeRoleList(state.availableRoles, detail);
    if (state.bootstrapData && Array.isArray(state.bootstrapData.roles)) {
        state.bootstrapData = {
            ...state.bootstrapData,
            roles: mergeRoleList(state.bootstrapData.roles, detail)
        };
    }

    return detail;
}

export async function loadRoleDetail({ role, sessionId = '', fetchJson, state }) {
    if (!role?.id) {
        throw new Error('缺少角色 ID');
    }
    if (role.details_loaded) {
        return role;
    }
    const data = await fetchJson(buildRoleDetailPath(role.id, sessionId));
    const detail = {
        ...(data.role || {}),
        details_loaded: true
    };
    return mergeRoleDetailIntoRoleLists(state, detail);
}
