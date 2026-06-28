// ========== 会话 API ==========
import { fetchJson, postJson } from '../utils/http.js';

export async function getSessions() {
    return fetchJson('/api/group-chat/sessions');
}

export async function getSessionDetail(sessionId) {
    return fetchJson(`/api/group-chat/sessions/${sessionId}`);
}

export async function createSession(profileId) {
    return postJson('/api/group-chat/sessions', { profile_id: profileId });
}

export async function sendMessage(sessionId, content) {
    return postJson(`/api/group-chat/sessions/${sessionId}/messages`, { content });
}
