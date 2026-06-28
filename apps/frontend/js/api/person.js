import { deleteJson, fetchJson, postJson } from '../utils/http.js';

export async function getPersons() {
    return fetchJson('/api/persons');
}

export async function createPerson(data) {
    return postJson('/api/persons', data);
}

export async function createPersonFromTemplate(data) {
    return postJson('/api/persons/from-template', data);
}

export async function getRoleTemplates() {
    return fetchJson('/api/role-templates');
}

export async function addTeamPersonMember(teamId, data) {
    return postJson(`/api/teams/${encodeURIComponent(teamId)}/person-members`, data);
}

export async function removeTeamPersonMember(teamId, personId) {
    return deleteJson(`/api/teams/${encodeURIComponent(teamId)}/person-members/${encodeURIComponent(personId)}`);
}

export async function addGroupPersonMember(profileId, data) {
    return postJson(`/api/group-profiles/${encodeURIComponent(profileId)}/person-members`, data);
}

export async function removeGroupPersonMember(profileId, personId) {
    return deleteJson(`/api/group-profiles/${encodeURIComponent(profileId)}/person-members/${encodeURIComponent(personId)}`);
}

export async function bindPersonRuntimeRole(personId, data) {
    return fetchJson(`/api/persons/${encodeURIComponent(personId)}/runtime-role`, {
        method: 'PATCH',
        body: JSON.stringify(data || {})
    });
}

export async function generatePersonRuntimeRole(personId, data = {}) {
    return postJson(`/api/persons/${encodeURIComponent(personId)}/runtime-role/generate`, data);
}
