const assert = require('assert');
const fs = require('fs');
const path = require('path');

function testServerExposesPersonRuntimeRoleBindingRoute() {
    const serverSource = fs.readFileSync(
        path.join(__dirname, '../src/server.js'),
        'utf8'
    );

    assert.match(
        serverSource,
        /\/api\/persons\/:id\/runtime-role/,
        'server exposes a Person runtime-role binding route'
    );
    assert.match(
        serverSource,
        /vcpCoreClient\.getRole\(roleId\)/,
        'server verifies the runtime role exists before binding it to a Person'
    );
    assert.match(
        serverSource,
        /bindPersonRuntimeRole/,
        'server delegates Person runtime role binding to PersonIdentityService'
    );
    assert.match(
        serverSource,
        /runtime_role/,
        'server returns runtime role details in the binding response'
    );
}

function testServerExposesPersonRuntimeRoleGenerationRoute() {
    const serverSource = fs.readFileSync(
        path.join(__dirname, '../src/server.js'),
        'utf8'
    );
    const generationServiceSource = fs.readFileSync(
        path.join(__dirname, '../src/services/personRuntimeRoleGenerationService.js'),
        'utf8'
    );

    assert.match(
        serverSource,
        /\/api\/persons\/:id\/runtime-role\/generate/,
        'server exposes a Person runtime role generation route'
    );
    assert.match(
        serverSource,
        /generatePersonRuntimeRole/,
        'server delegates Person runtime role generation to the product-layer service'
    );
    assert.match(
        generationServiceSource,
        /buildPersonRuntimeRoleImportPayload/,
        'generation service builds a product-layer runtime role import payload from the Person identity'
    );
    assert.match(
        generationServiceSource,
        /vcpCoreClient\.importRole/,
        'generation service imports the generated Person runtime role through VCP core'
    );
    assert.match(
        generationServiceSource,
        /bindPersonRuntimeRole/,
        'generation service binds the imported runtime role back to the long-lived Person'
    );
    assert.match(
        generationServiceSource,
        /core role import did not return a role id/,
        'generation service reports a gateway error when core import does not return a runtime role id'
    );
}

function testBackendUsesSharedHttpErrorHelper() {
    const serverSource = fs.readFileSync(
        path.join(__dirname, '../src/server.js'),
        'utf8'
    );
    const generationServiceSource = fs.readFileSync(
        path.join(__dirname, '../src/services/personRuntimeRoleGenerationService.js'),
        'utf8'
    );
    const payloadGuardSource = fs.readFileSync(
        path.join(__dirname, '../src/services/apiPayloadGuards.js'),
        'utf8'
    );

    assert.match(
        serverSource,
        /require\('\.\/services\/httpError'\)/,
        'server reuses the shared HTTP error helper'
    );
    assert.doesNotMatch(
        serverSource,
        /function createHttpError/,
        'server does not keep a local createHttpError copy'
    );
    assert.match(
        generationServiceSource,
        /require\('\.\/httpError'\)/,
        'generation service reuses the shared HTTP error helper'
    );
    assert.doesNotMatch(
        generationServiceSource,
        /function createHttpError/,
        'generation service does not keep a local createHttpError copy'
    );
    assert.match(
        payloadGuardSource,
        /require\('\.\/httpError'\)/,
        'payload guards reuse the shared HTTP error helper'
    );
    assert.doesNotMatch(
        payloadGuardSource,
        /function createHttpError/,
        'payload guards do not keep a local createHttpError copy'
    );
}

testServerExposesPersonRuntimeRoleBindingRoute();
testServerExposesPersonRuntimeRoleGenerationRoute();
testBackendUsesSharedHttpErrorHelper();
console.log('personRuntimeRoleApi.test.js route contract checks passed');
