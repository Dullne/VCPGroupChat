const assert = require('assert');

const {
    resolveMemoryOwner
} = require('../src/services/memoryOwnerResolver');

const person = {
    id: 'person_ada',
    display_name: 'Ada',
    memory: {
        privateNotebook: 'Ada'
    }
};

function testPrivateCandidateWithTargetPersonResolvesToPersonNotebook() {
    const result = resolveMemoryOwner({
        scope: 'private',
        target_person_id: 'person_ada',
        notebook: 'wrong'
    }, {
        getPerson: id => (id === 'person_ada' ? person : null)
    });

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.owner_type, 'person');
    assert.strictEqual(result.owner_id, 'person_ada');
    assert.strictEqual(result.notebook, 'Ada');
}

function testPrivateCandidateWithAgencyTemplateOnlyRequiresPersonSelection() {
    const result = resolveMemoryOwner({
        scope: 'private',
        target_role_id: 'agency_ai_engineer',
        target_role_source: 'agency_agents',
        notebook: 'AI Engineer'
    }, {
        getPerson: () => null,
        getPersonByLegacyRoleId: () => null,
        getRoleTemplate: () => ({ id: 'agency_ai_engineer', source: 'agency_agents' })
    });

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.code, 'template_requires_person');
}

function testLegacyRoleFallsBackToBackfilledPerson() {
    const result = resolveMemoryOwner({
        scope: 'private',
        target_role_id: 'ji_archivist',
        notebook: '小吉'
    }, {
        getPerson: () => null,
        getPersonByLegacyRoleId: roleId => roleId === 'ji_archivist'
            ? { id: 'person_legacy_ji_archivist', display_name: '犬娘小吉', memory: { privateNotebook: '小吉' } }
            : null
    });

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.owner_type, 'person');
    assert.strictEqual(result.owner_id, 'person_legacy_ji_archivist');
    assert.strictEqual(result.notebook, '小吉');
    assert.strictEqual(result.legacy_role_id, 'ji_archivist');
}

function testSharedCandidateDoesNotRequirePerson() {
    const result = resolveMemoryOwner({
        scope: 'shared',
        notebook: ''
    }, {});

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.owner_type, 'shared');
    assert.strictEqual(result.owner_id, '公共');
    assert.strictEqual(result.notebook, '公共');
}

testPrivateCandidateWithTargetPersonResolvesToPersonNotebook();
testPrivateCandidateWithAgencyTemplateOnlyRequiresPersonSelection();
testLegacyRoleFallsBackToBackfilledPerson();
testSharedCandidateDoesNotRequirePerson();
console.log('memoryOwnerResolver.test.js passed');
