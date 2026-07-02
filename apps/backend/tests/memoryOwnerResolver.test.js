const assert = require('assert');

const {
    resolveMemoryOwner,
    resolveNotebookId,
    getPersonNotebookId,
    getSharedNotebookId
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

// ---- notebook_id 命名空间隔离 ----

const aliceA = { id: 'person_alice_a', display_name: 'Alice', memory: { privateNotebook: 'Alice' } };
const aliceB = { id: 'person_alice_b', display_name: 'Alice', memory: { privateNotebook: 'Alice' } };

function testTwoSameNamePersonsGetDifferentNotebookIds() {
    const idA = getPersonNotebookId(aliceA, 'private');
    const idB = getPersonNotebookId(aliceB, 'private');
    assert.strictEqual(idA, 'person-person_alice_a-private');
    assert.strictEqual(idB, 'person-person_alice_b-private');
    assert.notStrictEqual(idA, idB);
}

function testKnowledgeNotebookIdHasKnowledgeSuffix() {
    const id = getPersonNotebookId(aliceA, 'knowledge');
    assert.strictEqual(id, 'person-person_alice_a-knowledge');
}

function testSharedNotebookIdPrefixed() {
    // getSharedNotebookId 保留作为 v2 预留 API；v1 共享本仍用显示名。
    assert.strictEqual(getSharedNotebookId('公共'), 'shared-公共');
    assert.strictEqual(getSharedNotebookId('Alice notes'), 'shared-Alice_notes');
    assert.strictEqual(getSharedNotebookId(''), '');
}

function testNotebookIdSurvivesFolderSanitization() {
    // 与 VCPToolBox DailyNote sanitizePathComponent 对齐：不应被二次 sanitize 改变
    const id = getPersonNotebookId({ id: 'person_abc123' }, 'private');
    const sanitized = String(id)
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/[\x00-\x1f\x7f]/g, '')
        .replace(/\s+/g, '_')
        .replace(/^[._]+|[._]+$/g, '')
        .replace(/_+/g, '_');
    assert.strictEqual(sanitized, id);
}

function testResolveNotebookIdPrivateUsesPersonId() {
    const id = resolveNotebookId(
        { scope: 'private', target_person_id: 'person_ada' },
        { getPerson: () => person }
    );
    assert.strictEqual(id, 'person-person_ada-private');
}

function testResolveNotebookIdSharedKeepsDisplayNameInV1() {
    // v1：共享本保持显示名（authored 占位符兼容），不前缀 shared-
    const id = resolveNotebookId({ scope: 'shared', notebook: '公共' }, {});
    assert.strictEqual(id, '公共');
}

function testResolveNotebookIdLegacyFallback() {
    const id = resolveNotebookId({ scope: 'private', target_role_id: 'ji_archivist' }, {
        getPerson: () => null,
        getPersonByLegacyRoleId: () => null
    });
    assert.strictEqual(id, 'legacy-ji_archivist-private');
}

testTwoSameNamePersonsGetDifferentNotebookIds();
testKnowledgeNotebookIdHasKnowledgeSuffix();
testSharedNotebookIdPrefixed();
testNotebookIdSurvivesFolderSanitization();
testResolveNotebookIdPrivateUsesPersonId();
testResolveNotebookIdSharedKeepsDisplayNameInV1();
testResolveNotebookIdLegacyFallback();

console.log('memoryOwnerResolver.test.js passed');
