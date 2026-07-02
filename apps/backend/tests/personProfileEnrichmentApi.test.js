const assert = require('assert');
const fs = require('fs');
const path = require('path');

function testServerExposesProductLayerProfileEnrichmentRoute() {
    const serverSource = fs.readFileSync(
        path.join(__dirname, '../src/server.js'),
        'utf8'
    );

    assert.match(
        serverSource,
        /require\('\.\/services\/personProfileEnrichmentService'\)/,
        'server imports the product-layer Person profile enrichment service'
    );
    assert.match(
        serverSource,
        /\/api\/person-profiles\/enrich/,
        'server exposes a bulk Person profile enrichment route'
    );
    assert.match(
        serverSource,
        /enrichSparsePersonProfiles/,
        'profile enrichment route delegates sparse-profile selection and runtime sync to the service'
    );
    assert.match(
        serverSource,
        /sync_runtime/,
        'profile enrichment route lets the product layer control runtime role synchronization'
    );
    assert.match(
        serverSource,
        /result\.failed\.length \? 207 : 200/,
        'profile enrichment route returns a multi-status response when some enrichments fail'
    );
}

function testProfileEnrichmentServiceKeepsCoreAsRuntimeRoleBoundary() {
    const enrichmentServiceSource = fs.readFileSync(
        path.join(__dirname, '../src/services/personProfileEnrichmentService.js'),
        'utf8'
    );

    assert.match(
        enrichmentServiceSource,
        /updatePersonProfile/,
        'enrichment service updates long-lived product-layer Person profiles first'
    );
    assert.match(
        enrichmentServiceSource,
        /generatePersonRuntimeRole/,
        'enrichment service syncs runtime roles through the existing product-layer bridge'
    );
    assert.match(
        enrichmentServiceSource,
        /syncRuntime/,
        'enrichment service can dry-run or apply product profile changes without forcing runtime sync'
    );
}

testServerExposesProductLayerProfileEnrichmentRoute();
testProfileEnrichmentServiceKeepsCoreAsRuntimeRoleBoundary();
console.log('personProfileEnrichmentApi.test.js passed');
