// ========== 左侧栏渲染 ==========
import { state } from '../core/state.js';
import { fetchJson } from '../utils/http.js';
import { showToast } from '../utils/ui-helpers.js';
import { formatSidebarSessionTime } from './sidebar-time-format.js';
import { switchSidebarSession } from './sidebar-session-switch.js';

export function renderSidebarGroupList() {
    const container = document.getElementById('sidebar-group-list');
    if (!container) return;

    const groups = state.bootstrapData?.profiles || [];
    container.innerHTML = groups.map(g => `
        <div class="group-item ${g.id === state.selectedProfileId ? 'active' : ''}" data-id="${g.id}">
            <span class="group-icon">#</span>
            <span class="group-name">${g.name}</span>
        </div>
    `).join('');

    container.querySelectorAll('.group-item').forEach(item => {
        item.addEventListener('click', () => {
            state.selectedProfileId = item.dataset.id;
            renderSidebarGroupList();
        });
    });
}

export function renderSidebarSessionList() {
    const container = document.getElementById('sidebar-session-list');
    if (!container) return;

    const sessions = state.sessions || [];
    if (sessions.length === 0) {
        container.innerHTML = '<div class="session-empty">暂无会话</div>';
        return;
    }

    container.innerHTML = sessions.map(s => `
        <div class="session-item ${s.id === state.selectedSessionId ? 'active' : ''}" data-id="${s.id}">
            <span class="session-icon">📝</span>
                <div class="session-info">
                    <div class="session-title">${s.profile_name || '未命名会话'}</div>
                    <div class="session-time">${formatSidebarSessionTime(s.updated_at)}</div>
                </div>
            </div>
    `).join('');

    container.querySelectorAll('.session-item').forEach(item => {
        item.addEventListener('click', async () => {
            await switchSidebarSession({
                sessionId: item.dataset.id,
                state,
                fetchJson,
                renderSidebarSessionList,
                showToast
            });
        });
    });
}
