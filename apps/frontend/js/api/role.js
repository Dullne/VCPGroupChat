// ========== 角色 API ==========
import { fetchJson, postJson, deleteJson } from '../utils/http.js';

export async function getRoles() {
    return fetchJson('/api/roles');
}

export async function createRole(data) {
    return postJson('/api/roles', data);
}

export async function updateRole(roleId, data) {
    return postJson(`/api/roles/${roleId}`, data);
}

export async function deleteRole(roleId) {
    return deleteJson(`/api/roles/${roleId}`);
}

export async function draftRole(idea, model) {
    return postJson('/api/roles/draft', { idea, model });
}

export async function getImportSources() {
    return fetchJson('/api/import-sources');
}

export async function importRole(sourceId, itemId, options = {}) {
    return postJson(`/api/import-sources/${sourceId}/import/${itemId}`, options);
}
