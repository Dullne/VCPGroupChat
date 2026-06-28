const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');

async function loadModule() {
    const modulePath = path.join(__dirname, '../scripts/runtime-hygiene-prune.mjs');
    return import(pathToFileURL(modulePath).href);
}

async function testRefusesDeleteWithoutEnvGuard() {
    const { assertPruneAllowed } = await loadModule();
    assert.throws(
        () => assertPruneAllowed({ env: {}, confirm: true }),
        /GROUPCHAT_RUNTIME_PRUNE=1 is required/
    );
}

async function testRefusesDeleteWithoutConfirmFlag() {
    const { assertPruneAllowed } = await loadModule();
    assert.throws(
        () => assertPruneAllowed({ env: { GROUPCHAT_RUNTIME_PRUNE: '1' }, confirm: false }),
        /--confirm-empty-smoke-sessions is required/
    );
}

async function testAllowsDeleteWithBothGuards() {
    const { assertPruneAllowed } = await loadModule();
    assert.equal(
        assertPruneAllowed({
            env: { GROUPCHAT_RUNTIME_PRUNE: '1' },
            confirm: true
        }),
        true
    );
}

async function run() {
    await testRefusesDeleteWithoutEnvGuard();
    await testRefusesDeleteWithoutConfirmFlag();
    await testAllowsDeleteWithBothGuards();
    console.log('runtimeHygienePrune.test.js passed');
}

run().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
