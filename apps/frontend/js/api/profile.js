// ========== 群组 API ==========
import { fetchJson, postJson, deleteJson } from '../utils/http.js';

export async function getProfiles() {
    return fetchJson('/api/profiles');
}

export async function createProfile(data) {
    return postJson('/api/profiles', data);
}

export async function updateProfile(profileId, data) {
    return postJson(`/api/profiles/${profileId}`, data);
}

export async function deleteProfile(profileId) {
    return deleteJson(`/api/profiles/${profileId}`);
}

export async function loadProfile(profileId) {
    return postJson(`/api/profiles/${profileId}/load`);
}
