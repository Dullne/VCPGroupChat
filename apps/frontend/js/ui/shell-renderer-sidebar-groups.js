import { escapeHtml } from '../utils/formatting.js';

export function renderShellSidebarGroupList(deps) {
    const {
        getBootstrapData,
        getSelectedProfileId,
        setSelectedProfileId,
        getSessions,
        switchSession,
        getProfileById,
        resolveManagedTeamId,
        setSelectedTeamId,
        getDom,
        renderAll,
        formatDateTime
    } = deps;

    const container = document.getElementById('sidebar-group-list');
    if (!container) {
        return;
    }

    const bootstrapData = getBootstrapData();
    const profiles = bootstrapData?.profiles || [];
    const selectedProfileId = getSelectedProfileId();

    if (!profiles.length) {
        container.innerHTML = '<div class="session-empty">暂无群聊。点击“发起群聊”创建第一个 AI 群聊。</div>';
        return;
    }

    const sessionsByProfile = new Map();
    for (const session of getSessions?.() || []) {
        const list = sessionsByProfile.get(session.profile_id) || [];
        list.push(session);
        sessionsByProfile.set(session.profile_id, list);
    }

    const chatItems = profiles.map(profile => {
        const sessions = (sessionsByProfile.get(profile.id) || [])
            .sort((left, right) =>
                new Date(right.updated_at || right.created_at || 0) - new Date(left.updated_at || left.created_at || 0)
            );
        return {
            profile,
            latestSession: sessions[0] || null,
            sessionCount: sessions.length || Number(profile.session_count || 0),
            sortTime: sessions[0]?.updated_at || sessions[0]?.created_at || profile.latest_session_updated_at || ''
        };
    }).sort((left, right) =>
        new Date(right.sortTime || 0) - new Date(left.sortTime || 0)
    );

    container.innerHTML = chatItems.map(({ profile, latestSession, sessionCount }) => {
        const updatedAt = latestSession?.updated_at || profile.latest_session_updated_at;
        const summary = latestSession?.title || profile.description || '还没有聊天，点击进入后开始新对话';
        const timeText = updatedAt && formatDateTime ? formatDateTime(updatedAt) : '未开始';
        const sessionText = sessionCount > 0 ? `${sessionCount} 段历史` : '新群聊';
        const modeText = profile.mode === 'invite_only' ? '邀请发言' : profile.mode === 'naturerandom' ? '自然随机' : '顺序协作';
        return `
            <div class="group-item chat-room-item ${profile.id === selectedProfileId ? 'active' : ''}" data-id="${escapeHtml(profile.id)}">
                <span class="group-icon chat-room-avatar">#</span>
                <div class="chat-room-copy">
                    <div class="chat-room-topline">
                        <span class="group-name chat-room-name">${escapeHtml(profile.name || profile.id || '未命名群聊')}</span>
                        <span class="chat-room-time">${escapeHtml(timeText)}</span>
                    </div>
                    <div class="chat-room-summary">${escapeHtml(summary)}</div>
                    <div class="chat-room-meta">
                        <span>${escapeHtml(sessionText)}</span>
                        <span>${escapeHtml(modeText)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.group-item').forEach(item => {
        item.addEventListener('click', async () => {
            const profileId = item.dataset.id;
            if (!profileId || profileId === getSelectedProfileId()) {
                return;
            }
            const targetSession = (getSessions?.() || [])
                .filter(session => session.profile_id === profileId)
                .sort((left, right) =>
                    new Date(right.updated_at || right.created_at || 0) - new Date(left.updated_at || left.created_at || 0)
                )[0];
            if (targetSession?.id && switchSession) {
                await switchSession(targetSession.id);
                return;
            }
            setSelectedProfileId?.(profileId);
            const profile = getProfileById?.(profileId);
            if (profile?.team_id) {
                setSelectedTeamId?.(resolveManagedTeamId?.(profile.team_id) || profile.team_id);
            }
            const dom = getDom?.();
            if (dom?.profileSelect) {
                dom.profileSelect.value = profileId;
            }
            renderAll?.();
        });
    });
}
