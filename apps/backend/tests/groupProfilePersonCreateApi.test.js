const assert = require('assert');
const fs = require('fs');
const path = require('path');

const serverSource = fs.readFileSync(
    path.join(__dirname, '../src/server.js'),
    'utf8'
);

function getRoute(method, route) {
    const start = serverSource.indexOf(`app.${method}('${route}'`);
    assert.notStrictEqual(start, -1, `${route} exists`);
    const next = serverSource.indexOf('\napp.', start + 1);
    return serverSource.slice(start, next === -1 ? serverSource.length : next);
}

const createProfileRoute = getRoute('post', '/api/group-profiles');
assert.match(
    createProfileRoute,
    /person_members/,
    'group profile create accepts person_members'
);
assert.match(
    createProfileRoute,
    /personIdentityService\.addGroupPersonMember/,
    'group profile create writes group person membership'
);
assert.doesNotMatch(
    createProfileRoute,
    /members:\s*req\.body\?\.members\s*\|\|\s*\[\]/,
    'product create route does not blindly pass runtime members'
);

assert.doesNotMatch(
    serverSource,
    /app\.post\('\/api\/import-sources\/:source\/import'/,
    'external templates are no longer directly imported into runtime roles'
);
assert.doesNotMatch(
    serverSource,
    new RegExp([
        ['create', 'profile'].join('_'),
        ['attach', 'profile', 'id'].join('_')
    ].join('|')),
    'legacy import-to-group parameters have been removed from the product backend'
);

const movePersonMemberRoute = getRoute('patch', '/api/group-profiles/:id/person-members/:personId/order');
assert.match(
    movePersonMemberRoute,
    /personIdentityService\.moveGroupPersonMember/,
    'group person member ordering uses person membership service'
);
assert.doesNotMatch(
    movePersonMemberRoute,
    /sessionService\.moveProfileMember/,
    'group person member ordering does not reorder legacy runtime membership directly'
);
assert.doesNotMatch(
    movePersonMemberRoute,
    /group_profile_members.*role_order.*req\.body/,
    'group person member ordering does not write raw runtime order from request data'
);

console.log('groupProfilePersonCreateApi.test.js passed');
