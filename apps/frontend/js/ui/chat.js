// ========== 聊天消息渲染 ==========
import { state } from '../core/state.js';

export function renderMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const messages = state.messages || [];

    if (messages.length === 0) {
        container.innerHTML = '<div class="chat-empty">暂无消息，开始对话吧！</div>';
        return;
    }

    container.innerHTML = messages.map(msg => {
        const isUser = msg.role === 'user';
        const content = typeof marked !== 'undefined' ? marked.parse(msg.content) : msg.content;

        return `
            <div class="message ${isUser ? 'user-message' : 'ai-message'}">
                <div class="message-header">
                    <span class="message-sender">${msg.sender || (isUser ? '用户' : 'AI')}</span>
                    <span class="message-time">${formatMessageTime(msg.timestamp)}</span>
                </div>
                <div class="message-content">${content}</div>
            </div>
        `;
    }).join('');

    container.scrollTop = container.scrollHeight;
}

export async function sendMessage(content) {
    const { state } = await import('../core/state.js');
    const { fetchJson } = await import('../utils/http.js');
    const { showToast } = await import('../utils/ui-helpers.js');

    if (!state.selectedSessionId) {
        showToast('请先选择或创建会话', 'warning');
        return;
    }

    try {
        const response = await fetchJson(`/api/group-chat/sessions/${state.selectedSessionId}/messages`, {
            method: 'POST',
            body: JSON.stringify({
                content: { text: content },
                include_role_ids: [],
                exclude_role_ids: []
            })
        });

        state.messages = response.messages || [];
        renderMessages();
    } catch (error) {
        console.error('发送消息失败:', error);
        throw error;
    }
}

function formatMessageTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}
