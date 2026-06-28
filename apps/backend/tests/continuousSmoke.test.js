const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');

async function loadSmokeModule() {
    const modulePath = path.join(__dirname, '../scripts/continuous-smoke.mjs');
    return import(pathToFileURL(modulePath).href);
}

async function testRoleSummaryAssertionRejectsHeavyFields() {
    const { assertRoleSummaryList } = await loadSmokeModule();

    assert.throws(
        () => assertRoleSummaryList([
            {
                id: 'role_a',
                name: 'Role A',
                details_loaded: false,
                role_spec: { persona: 'heavy detail' }
            }
        ], '/api/bootstrap.roles'),
        /\/api\/bootstrap\.roles contains heavy role fields: role_a\.role_spec/
    );
}

async function testRoleSummaryAssertionRejectsInvalidSummaries() {
    const { assertRoleSummaryList } = await loadSmokeModule();

    assert.throws(
        () => assertRoleSummaryList([
            {
                id: 'role_a',
                name: 'Role A',
                details_loaded: true
            },
            {
                id: '',
                name: 'Role B',
                details_loaded: false
            }
        ], '/api/roles.roles'),
        /\/api\/roles\.roles contains invalid role summaries: role_a\.details_loaded, <missing-id>\.id/
    );
}

async function testBudgetAssertionIncludesMeasuredAndLimitBytes() {
    const { assertBudgetAtMost } = await loadSmokeModule();

    assert.equal(assertBudgetAtMost(8_760, 12_000, '/api/roles gzip bytes'), 8_760);
    assert.throws(
        () => assertBudgetAtMost(12_001, 12_000, '/api/roles gzip bytes'),
        /\/api\/roles gzip bytes exceeds budget: 12001 > 12000/
    );
}

async function testHeaderAssertionIsCaseInsensitive() {
    const { assertHeaderEquals } = await loadSmokeModule();
    const headers = {
        'x-groupchat-role-summary-contract': 'role-summary-v1'
    };

    assertHeaderEquals(headers, 'X-GroupChat-Role-Summary-Contract', 'role-summary-v1', '/api/bootstrap');
    assert.throws(
        () => assertHeaderEquals(headers, 'Content-Encoding', 'gzip', '/api/roles'),
        /\/api\/roles expected Content-Encoding: gzip, got <missing>/
    );
}

async function run() {
    await testRoleSummaryAssertionRejectsHeavyFields();
    await testRoleSummaryAssertionRejectsInvalidSummaries();
    await testBudgetAssertionIncludesMeasuredAndLimitBytes();
    await testHeaderAssertionIsCaseInsensitive();
    console.log('continuousSmoke.test.js passed');
}

run().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
