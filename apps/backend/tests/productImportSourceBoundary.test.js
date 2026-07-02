const assert = require('assert');
const fs = require('fs');
const path = require('path');

const serverSource = fs.readFileSync(
    path.join(__dirname, '../src/server.js'),
    'utf8'
);
const vcpCoreClientSource = fs.readFileSync(
    path.join(__dirname, '../src/services/vcpCoreClient.js'),
    'utf8'
);

function getRoute(method, route) {
    const start = serverSource.indexOf(`app.${method}('${route}'`);
    assert.notStrictEqual(start, -1, `${method.toUpperCase()} ${route} exists`);
    const next = serverSource.indexOf('\napp.', start + 1);
    return serverSource.slice(start, next === -1 ? serverSource.length : next);
}

function testImportSourceCatalogBelongsToProductLayer() {
    const routeBlock = getRoute('get', '/api/import-sources');

    assert.match(
        routeBlock,
        /roleStudioSourceService\.listLegacyImportSources/,
        'legacy import-source catalog is produced by the product role-studio source service'
    );
    assert.doesNotMatch(
        routeBlock,
        /vcpCoreClient\.listImportSources/,
        'product import-source catalog must not proxy core import-source scanning'
    );
}

function testImportSourceImportBuildsRuntimePayloadInProductLayer() {
    assert.strictEqual(
        serverSource.indexOf(`app.post('/api/${['import', 'sources'].join('-')}/:source/import'`),
        -1,
        'external template catalog no longer exposes a direct runtime-role import route'
    );
}

function testCoreClientDoesNotExposeProductImportSourceHelpers() {
    assert.doesNotMatch(
        vcpCoreClientSource,
        /async\s+listImportSources\s*\(/,
        'VcpCoreClient should not expose product catalog listing helpers'
    );
    assert.doesNotMatch(
        vcpCoreClientSource,
        /async\s+importFromSource\s*\(/,
        'VcpCoreClient should not expose product catalog import helpers'
    );
    assert.match(
        vcpCoreClientSource,
        /async\s+importRole\s*\(/,
        'VcpCoreClient keeps the core runtime-role import API'
    );
}

testImportSourceCatalogBelongsToProductLayer();
testImportSourceImportBuildsRuntimePayloadInProductLayer();
testCoreClientDoesNotExposeProductImportSourceHelpers();
console.log('productImportSourceBoundary.test.js passed');
