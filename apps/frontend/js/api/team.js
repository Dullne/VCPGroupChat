// ========== 团队 API ==========
import { fetchJson, postJson, deleteJson } from '../utils/http.js';

export async function getTeams() {
    return fetchJson('/api/teams');
}

export async function createTeam(data) {
    return postJson('/api/teams', data);
}

export async function updateTeam(teamId, data) {
    return postJson(`/api/teams/${teamId}`, data);
}

export async function deleteTeam(teamId) {
    return deleteJson(`/api/teams/${teamId}`);
}
