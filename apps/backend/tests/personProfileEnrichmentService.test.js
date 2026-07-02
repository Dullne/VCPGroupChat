const assert = require('assert');

const {
    enrichSparsePersonProfiles,
    listSparsePersonProfileCandidates
} = require('../src/services/personProfileEnrichmentService');

function createPersonIdentityService({ persons, templates = {} }) {
    const calls = [];
    const personById = new Map(persons.map(person => [person.id, { ...person }]));

    return {
        calls,
        listPersons() {
            calls.push(['listPersons']);
            return [...personById.values()].map(person => ({ ...person }));
        },
        getPerson(personId) {
            calls.push(['getPerson', personId]);
            const person = personById.get(personId);
            return person ? { ...person } : null;
        },
        getRoleTemplate(templateId) {
            calls.push(['getRoleTemplate', templateId]);
            return templates[templateId] || null;
        },
        updatePersonProfile(personId, patch) {
            calls.push(['updatePersonProfile', personId, patch]);
            const person = personById.get(personId);
            assert.ok(person, `person exists: ${personId}`);
            Object.assign(person, patch);
            return { ...person };
        },
        bindPersonRuntimeRole(personId, payload) {
            calls.push(['bindPersonRuntimeRole', personId, payload]);
            const person = personById.get(personId);
            assert.ok(person, `person exists: ${personId}`);
            person.legacy_role_id = payload.role_id;
            return { ...person };
        }
    };
}

async function testDryRunFindsActiveSparseProfilesWithoutMutating() {
    const personIdentityService = createPersonIdentityService({
        persons: [
            {
                id: 'person_sparse',
                display_name: '策士阿澄',
                legacy_role_id: 'runtime_asheng',
                lifecycle_status: 'active',
                description: '',
                personality: '',
                emotional_style: '',
                voice_style: ''
            },
            {
                id: 'person_ready',
                display_name: '完整人物',
                lifecycle_status: 'active',
                description: '已有定位',
                personality: '已有性格',
                emotional_style: '已有情绪',
                voice_style: '已有表达'
            },
            {
                id: 'person_archived',
                display_name: '归档人物',
                lifecycle_status: 'archived',
                description: ''
            }
        ]
    });
    const vcpCoreClient = {
        async importRole() {
            throw new Error('dry run should not import runtime roles');
        }
    };

    const result = await enrichSparsePersonProfiles({
        personIdentityService,
        vcpCoreClient,
        dryRun: true
    });

    assert.strictEqual(result.dry_run, true);
    assert.strictEqual(result.candidate_count, 1);
    assert.deepStrictEqual(result.candidates.map(candidate => candidate.person_id), ['person_sparse']);
    assert.match(result.candidates[0].patch.description, /产品与技术之间/);
    assert.strictEqual(result.enriched.length, 0);
    assert.strictEqual(result.failed.length, 0);
    assert.strictEqual(
        personIdentityService.calls.some(call => call[0] === 'updatePersonProfile'),
        false,
        'dry-run does not mutate product-layer person profile'
    );
}

async function testApplyEnrichesProfileAndRegeneratesExistingRuntimeRole() {
    const personIdentityService = createPersonIdentityService({
        persons: [
            {
                id: 'person_legacy_ji_archivist',
                display_name: '犬娘小吉',
                legacy_role_id: 'ji_archivist',
                lifecycle_status: 'active',
                description: '',
                personality: '',
                emotional_style: '',
                voice_style: '',
                memory: { privateNotebook: '犬娘小吉' }
            }
        ]
    });
    const importedPayloads = [];
    const vcpCoreClient = {
        async importRole(payload) {
            importedPayloads.push(payload);
            return {
                id: payload.id,
                name: payload.name,
                description: payload.description,
                persona: payload.persona,
                voice_style: payload.voice_style,
                template_content: payload.template_content
            };
        }
    };

    const result = await enrichSparsePersonProfiles({
        personIdentityService,
        vcpCoreClient
    });

    assert.strictEqual(result.dry_run, false);
    assert.strictEqual(result.enriched.length, 1);
    assert.strictEqual(result.failed.length, 0);
    assert.strictEqual(importedPayloads.length, 1);
    assert.strictEqual(importedPayloads[0].id, 'ji_archivist');
    assert.match(importedPayloads[0].description, /记忆/);
    assert.match(importedPayloads[0].persona, /性格/);
    assert.match(importedPayloads[0].voice_style, /归档/);
    assert.match(importedPayloads[0].template_content, /人物私有记忆入口：\{\{犬娘小吉\}\}/);
    assert.strictEqual(importedPayloads[0].memory.owner_type, 'person');
    assert.strictEqual(importedPayloads[0].memory.owner_id, 'person_legacy_ji_archivist');
    assert.strictEqual(result.enriched[0].person.legacy_role_id, 'ji_archivist');
}

async function testDoesNotOverwriteCompleteProfilesUnlessForced() {
    const readyPerson = {
        id: 'person_ready',
        display_name: '完整人物',
        legacy_role_id: 'runtime_ready',
        lifecycle_status: 'active',
        description: '已有定位',
        personality: '已有性格',
        emotional_style: '已有情绪',
        voice_style: '已有表达'
    };
    assert.deepStrictEqual(
        listSparsePersonProfileCandidates({ persons: [readyPerson] }),
        [],
        'complete profiles are not candidates by default'
    );
    assert.strictEqual(
        listSparsePersonProfileCandidates({ persons: [readyPerson], force: true }).length,
        1,
        'force mode can regenerate a profile draft'
    );
}

async function run() {
    await testDryRunFindsActiveSparseProfilesWithoutMutating();
    await testApplyEnrichesProfileAndRegeneratesExistingRuntimeRole();
    await testDoesNotOverwriteCompleteProfilesUnlessForced();
    console.log('personProfileEnrichmentService.test.js passed');
}

run().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
