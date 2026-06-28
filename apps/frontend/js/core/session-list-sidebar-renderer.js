export function renderSessionSidebarList(deps) {
    const {
        sessions,
        activeSessionId,
        formatDateTime,
        switchSession
    } = deps;

    const sidebarList = document.getElementById('sidebar-session-list');
    if (!sidebarList) {
        return;
    }

    sidebarList.innerHTML = sessions.map(session => `
        <div class="session-item ${session.id === activeSessionId ? 'active' : ''}" data-id="${session.id}">
            <span class="session-icon">📝</span>
            <div class="session-info">
                <div class="session-title">${session.title || '未命名会话'}</div>
                <div class="session-time">${formatDateTime(session.updated_at)}</div>
            </div>
        </div>
    `).join('');

    sidebarList.querySelectorAll('.session-item').forEach(item => {
        item.addEventListener('click', async () => {
            await switchSession(item.dataset.id);
        });
    });
}

export function renderEmptySessionSidebar() {
    const sidebarList = document.getElementById('sidebar-session-list');
    if (sidebarList) {
        sidebarList.innerHTML = '<div class="session-empty">暂无会话</div>';
    }
}
