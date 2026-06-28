import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    buildRoleDetailPath,
    mergeRoleDetailIntoRoleLists
} from '../js/core/role-detail-cache.js';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = relativePath => readFileSync(join(repoRoot, relativePath), 'utf8');

function testBuildRoleDetailPathIncludesSessionIdWhenPresent() {
    assert.equal(
        buildRoleDetailPath('role/a b', 'sess/1'),
        '/api/roles/role%2Fa%20b?session_id=sess%2F1'
    );
    assert.equal(
        buildRoleDetailPath('role/a b', ''),
        '/api/roles/role%2Fa%20b'
    );
}

function testMergeRoleDetailIntoRoleListsKeepsOtherRolesStable() {
    const summary = { id: 'role_a', name: 'Role A', description: 'summary', details_loaded: false };
    const other = { id: 'role_b', name: 'Role B' };
    const detail = { id: 'role_a', name: 'Role A', description: 'detail', role_spec: { persona: 'full' }, details_loaded: true };
    const state = {
        availableRoles: [summary, other],
        bootstrapData: {
            roles: [summary, other]
        }
    };

    const merged = mergeRoleDetailIntoRoleLists(state, detail);

    assert.equal(merged, detail);
    assert.deepEqual(state.availableRoles, [detail, other]);
    assert.deepEqual(state.bootstrapData.roles, [detail, other]);
}

function testSessionRoleCardRendersDetailLoader() {
    const cardSource = read('js/ui/role-library-runtime-session-role-card.js');

    assert.match(
        cardSource,
        /detailLoader/,
        'session role card receives the lazy role detail loader block'
    );
    assert.match(
        cardSource,
        /if\s*\(\s*detailLoader\s*\)\s*\{\s*card\.appendChild\(detailLoader\);/s,
        'session role card appends the lazy role detail loader button'
    );
}

testBuildRoleDetailPathIncludesSessionIdWhenPresent();
testMergeRoleDetailIntoRoleListsKeepsOtherRolesStable();
testSessionRoleCardRendersDetailLoader();
console.log('role-detail-cache.test.mjs passed');
