const assert = require('assert');
const fs = require('fs');
const path = require('path');

function testServerExposesPersonMembershipRoutes() {
    const serverSource = fs.readFileSync(
        path.join(__dirname, '../src/server.js'),
        'utf8'
    );

    assert.match(
        serverSource,
        /\/api\/teams\/:id\/person-members/,
        'server exposes team person membership collection routes'
    );
    assert.match(
        serverSource,
        /\/api\/teams\/:id\/person-members\/:personId/,
        'server exposes team person membership delete route'
    );
    assert.match(
        serverSource,
        /\/api\/group-profiles\/:id\/person-members/,
        'server exposes group profile person membership collection routes'
    );
    assert.match(
        serverSource,
        /\/api\/group-profiles\/:id\/person-members\/:personId/,
        'server exposes group profile person membership delete route'
    );
}

function testServerKeepsRuntimeCompatibilityGuard() {
    const serverSource = fs.readFileSync(
        path.join(__dirname, '../src/server.js'),
        'utf8'
    );

    assert.match(
        serverSource,
        /requireRuntimePersonLegacyRole/,
        'person membership writes must reject people that are not connected to a runtime role yet'
    );
    assert.match(
        serverSource,
        /409/,
        'unmapped person runtime writes return a conflict instead of silently joining'
    );
    assert.match(
        serverSource,
        /addTeamPersonMember/,
        'team person membership route uses PersonIdentityService'
    );
    assert.match(
        serverSource,
        /removeGroupPersonMember/,
        'group person membership route uses PersonIdentityService removal'
    );
}

testServerExposesPersonMembershipRoutes();
testServerKeepsRuntimeCompatibilityGuard();
console.log('personMembershipApi.test.js route contract checks passed');
