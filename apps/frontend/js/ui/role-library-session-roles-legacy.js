export async function loadLegacyRoleLibrarySessionRoles(deps) {
    const {
        state,
        fetchJson,
        renderSessionRoleList
    } = deps;

    if (!state.selectedSessionId) {
        return;
    }

    try {
        const data = await fetchJson(`/api/group-chat/sessions/${state.selectedSessionId}`);
        state.sessionRoles = data.roles || [];
        renderSessionRoleList();
    } catch (error) {
        console.error('加载会话角色失败:', error);
    }
}

export function renderLegacyRoleLibrarySessionRoleList(state) {
    const container = document.getElementById('session-role-list');
    if (!container) {
        return;
    }

    const roles = state.sessionRoles || [];
    if (roles.length === 0) {
        container.innerHTML = '<div class="role-empty">当前会话暂无角色</div>';
        return;
    }

    container.innerHTML = roles.map(role => `
        <div class="session-role-item">
            <div class="role-item-name">${role.name}</div>
            <div class="role-item-meta">${role.description || ''}</div>
        </div>
    `).join('');
}
