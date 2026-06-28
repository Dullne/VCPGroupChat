const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');

async function loadModule() {
    const modulePath = path.join(__dirname, '../scripts/runtime-hygiene-report.mjs');
    return import(pathToFileURL(modulePath).href);
}

async function testClassifiesEmptySmokeSessionAsCandidate() {
    const { classifySessionCleanupCandidate } = await loadModule();
    const result = classifySessionCleanupCandidate({
        id: 'sess_smoke',
        title: 'ephemeral detail smoke abc',
        message_count: 0,
        ephemeral_role_count: 0,
        synthesis_count: 0,
        reflection_count: 0,
        memory_candidate_count: 0
    });

    assert.equal(result.safe, true);
    assert.equal(result.action, 'prune_empty_smoke_session');
}

async function testBlocksNonEmptySmokeSession() {
    const { classifySessionCleanupCandidate } = await loadModule();
    const result = classifySessionCleanupCandidate({
        id: 'sess_real',
        title: 'stream-smoke-20260623',
        message_count: 3,
        ephemeral_role_count: 0,
        synthesis_count: 0,
        reflection_count: 0,
        memory_candidate_count: 0
    });

    assert.equal(result.safe, false);
    assert.match(result.reason, /has dependent records/);
}

async function testBlocksOrdinaryEmptySession() {
    const { classifySessionCleanupCandidate } = await loadModule();
    const result = classifySessionCleanupCandidate({
        id: 'sess_new',
        title: '新会话',
        message_count: 0,
        ephemeral_role_count: 0,
        synthesis_count: 0,
        reflection_count: 0,
        memory_candidate_count: 0
    });

    assert.equal(result.safe, false);
    assert.match(result.reason, /title is not a known smoke prefix/);
}

async function run() {
    await testClassifiesEmptySmokeSessionAsCandidate();
    await testBlocksNonEmptySmokeSession();
    await testBlocksOrdinaryEmptySession();
    console.log('runtimeHygieneReport.test.js passed');
}

run().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
