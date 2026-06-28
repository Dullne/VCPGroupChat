import assert from 'node:assert/strict';

import { loadRoleDetail } from '../js/core/role-detail-cache.js';

const baseUrl = (process.env.GROUPCHAT_BACKEND_URL || 'http://127.0.0.1:7010').replace(/\/$/, '');

async function readJson(response) {
    const text = await response.text();
    try {
        return text ? JSON.parse(text) : {};
    } catch (error) {
        throw new Error(`Expected JSON from ${response.url}, got: ${text.slice(0, 300)}`);
    }
}

async function requestJson(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
            'content-type': 'application/json',
            ...(options.headers || {})
        }
    });
    const data = await readJson(response);
    if (!response.ok) {
        throw new Error(`${options.method || 'GET'} ${path} -> ${response.status}: ${JSON.stringify(data)}`);
    }
    return data;
}

async function deleteIfPresent(path) {
    const response = await fetch(`${baseUrl}${path}`, { method: 'DELETE' });
    if (![200, 204, 404].includes(response.status)) {
        const data = await readJson(response);
        throw new Error(`DELETE ${path} -> ${response.status}: ${JSON.stringify(data)}`);
    }
}

const suffix = Date.now().toString(36);
const sessionData = await requestJson('/api/group-chat/sessions', {
    method: 'POST',
    body: JSON.stringify({
        title: `ephemeral detail smoke ${suffix}`
    })
});

const sessionId = sessionData.session?.id;
assert.ok(sessionId, 'live smoke creates a session');

let ephemeralRoleId = '';

try {
    const roleData = await requestJson(`/api/group-chat/sessions/${encodeURIComponent(sessionId)}/ephemeral-roles`, {
        method: 'POST',
        body: JSON.stringify({
            name: `Ephemeral Detail Smoke ${suffix}`,
            description: 'Live smoke role for session-scoped lazy detail loading.',
            avatar: 'ED',
            persona: 'Checks that session_id is preserved when loading temporary role details.',
            responsibilities: [
                'Appear in the session-scoped role summary list',
                'Expose full role_spec only through the detail endpoint'
            ],
            model: 'smoke-model'
        })
    });

    ephemeralRoleId = roleData.role?.id;
    assert.ok(ephemeralRoleId, 'live smoke creates an ephemeral role');

    const summaryData = await requestJson(`/api/roles?session_id=${encodeURIComponent(sessionId)}`);
    const summary = (summaryData.roles || []).find(role => role.id === ephemeralRoleId);
    assert.ok(summary, 'session-scoped role summary includes the ephemeral role');
    assert.equal(summary.source, 'ephemeral');
    assert.equal(summary.details_loaded, false);
    assert.equal(summary.name, roleData.role.name);
    assert.equal(summary.description, roleData.role.description);
    assert.equal(summary.role_spec, undefined, 'role summary omits heavy role_spec');

    const state = {
        availableRoles: [summary],
        bootstrapData: { roles: [summary] }
    };
    const loadedByFrontendCache = await loadRoleDetail({
        role: summary,
        sessionId,
        fetchJson: requestJson,
        state
    });

    assert.equal(loadedByFrontendCache.id, ephemeralRoleId);
    assert.equal(loadedByFrontendCache.details_loaded, true);
    assert.equal(loadedByFrontendCache.role_spec?.model, 'smoke-model');
    assert.equal(state.availableRoles[0].details_loaded, true, 'frontend cache merges detail into available roles');
    assert.equal(state.bootstrapData.roles[0].details_loaded, true, 'frontend cache merges detail into bootstrap roles');

    const detailWithoutSession = await fetch(`${baseUrl}/api/roles/${encodeURIComponent(ephemeralRoleId)}`);
    assert.equal(detailWithoutSession.status, 404, 'ephemeral role detail is not globally addressable without session_id');

    const detailData = await requestJson(
        `/api/roles/${encodeURIComponent(ephemeralRoleId)}?session_id=${encodeURIComponent(sessionId)}`
    );
    assert.equal(detailData.role?.id, ephemeralRoleId);
    assert.equal(detailData.role?.source, 'ephemeral');
    assert.equal(detailData.role?.details_loaded, true);
    assert.equal(detailData.role?.role_spec?.persona, 'Checks that session_id is preserved when loading temporary role details.');
    assert.deepEqual(detailData.role?.role_spec?.responsibilities, [
        'Appear in the session-scoped role summary list',
        'Expose full role_spec only through the detail endpoint'
    ]);
} finally {
    if (ephemeralRoleId) {
        await deleteIfPresent(
            `/api/group-chat/sessions/${encodeURIComponent(sessionId)}/ephemeral-roles/${encodeURIComponent(ephemeralRoleId)}`
        );
    }
}

console.log('live ephemeral role detail smoke passed');
