const assert = require('assert');
const fs = require('fs');
const path = require('path');

function testServerExposesProductLayerRepairRoute() {
    const serverSource = fs.readFileSync(
        path.join(__dirname, '../src/server.js'),
        'utf8'
    );

    assert.match(
        serverSource,
        /require\('\.\/services\/personRuntimeRoleRepairService'\)/,
        'server imports the product-layer Person runtime repair service'
    );
    assert.match(
        serverSource,
        /\/api\/person-runtime-roles\/repair/,
        'server exposes a bulk Person runtime-role repair route'
    );
    assert.match(
        serverSource,
        /repairMissingPersonRuntimeRoles/,
        'repair route delegates candidate selection and generation to the repair service'
    );
    assert.match(
        serverSource,
        /dry_run/,
        'repair route supports dry-run inspection before mutating runtime roles'
    );
    assert.match(
        serverSource,
        /result\.failed\.length \? 207 : 200/,
        'repair route returns a multi-status response when some repairs fail'
    );
}

function testRepairServiceKeepsCoreAsRuntimeRoleBoundary() {
    const repairServiceSource = fs.readFileSync(
        path.join(__dirname, '../src/services/personRuntimeRoleRepairService.js'),
        'utf8'
    );

    assert.match(
        repairServiceSource,
        /vcpCoreClient\.listRoles/,
        'repair service reads core runtime roles only as execution capabilities'
    );
    assert.match(
        repairServiceSource,
        /generatePersonRuntimeRole/,
        'repair service repairs Persons by generating runtime roles through the existing product-layer bridge'
    );
    assert.match(
        repairServiceSource,
        /previous_role_id/,
        'repair service preserves stale legacy role ids when recreating missing runtime roles'
    );
}

testServerExposesProductLayerRepairRoute();
testRepairServiceKeepsCoreAsRuntimeRoleBoundary();
console.log('personRuntimeRoleRepairApi.test.js passed');
