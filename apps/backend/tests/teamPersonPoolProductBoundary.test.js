const assert = require('assert');
const fs = require('fs');
const path = require('path');

const serverSource = fs.readFileSync(
    path.join(__dirname, '../src/server.js'),
    'utf8'
);

function getRouteBlock(source, route) {
    const start = source.indexOf(`app.post('${route}'`);
    assert.notStrictEqual(start, -1, `route ${route} exists`);
    const nextRoute = source.indexOf('\napp.', start + 1);
    return source.slice(start, nextRoute === -1 ? source.length : nextRoute);
}

function getGetRouteBlock(source, route) {
    const start = source.indexOf(`app.get('${route}'`);
    assert.notStrictEqual(start, -1, `route ${route} exists`);
    const nextRoute = source.indexOf('\napp.', start + 1);
    return source.slice(start, nextRoute === -1 ? source.length : nextRoute);
}

function testBootstrapExposesTeamPersonPoolAsProductSourceOfTruth() {
    const bootstrapBlock = getGetRouteBlock(serverSource, '/api/bootstrap');

    assert.match(
        bootstrapBlock,
        /team_person_members_by_team_id/,
        'bootstrap exposes team person membership buckets'
    );
    assert.match(
        bootstrapBlock,
        /person_member_count/,
        'bootstrap teams expose product person-member counts separately from runtime compatibility counts'
    );
}

function testRoleStudioSaveTargetsCreatePersonMemberships() {
    const saveBlock = getRouteBlock(serverSource, '/api/role-studio/save');

    assert.match(
        saveBlock,
        /const person = createOrReuseRoleStudioPerson/,
        'saving any role-studio draft target creates or reuses a long-lived person identity'
    );
    assert.match(
        serverSource,
        /personIdentityService\.createPerson/,
        'the role-studio person helper persists a long-lived person identity'
    );
    assert.match(
        saveBlock,
        /personIdentityService\.addTeamPersonMember/,
        'saving to a team attaches the person to the Team Person Pool'
    );
    assert.match(
        saveBlock,
        /personIdentityService\.addGroupPersonMember/,
        'saving to a group attaches the person to group person membership'
    );
    assert.doesNotMatch(
        saveBlock,
        /sessionService\.addTeamMember\(\s*team\.id,\s*importedRole\.id/,
        'role-studio team target must not write only legacy runtime team_members'
    );
}

testBootstrapExposesTeamPersonPoolAsProductSourceOfTruth();
testRoleStudioSaveTargetsCreatePersonMemberships();
console.log('teamPersonPoolProductBoundary.test.js passed');
