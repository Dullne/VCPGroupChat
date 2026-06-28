export async function switchSidebarSession(deps) {
    const {
        sessionId,
        state,
        fetchJson,
        renderSidebarSessionList,
        showToast
    } = deps;

    try {
        state.selectedSessionId = sessionId;
        const detail = await fetchJson(`/api/group-chat/sessions/${sessionId}`);
        state.currentSession = detail;
        state.messages = detail.messages || [];

        window.dispatchEvent(new CustomEvent('session-changed'));
        renderSidebarSessionList();
    } catch (error) {
        showToast(`切换会话失败：${error.message}`, 'danger');
    }
}
