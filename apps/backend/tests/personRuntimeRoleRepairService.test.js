const assert = require('assert');

const {
    repairMissingPersonRuntimeRoles
} = require('../src/services/personRuntimeRoleRepairService');

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
        bindPersonRuntimeRole(personId, payload) {
            calls.push(['bindPersonRuntimeRole', personId, payload]);
            const person = personById.get(personId);
            assert.ok(person, `person exists: ${personId}`);
            person.legacy_role_id = payload.role_id;
            return { ...person };
        }
    };
}

async function testDryRunFindsOnlyActivePersonsWithoutUsableRuntimeRole() {
    const personIdentityService = createPersonIdentityService({
        persons: [
            { id: 'person_ready', display_name: 'Ready', legacy_role_id: 'runtime_ready', lifecycle_status: 'active' },
            { id: 'person_stale', display_name: 'Stale', legacy_role_id: 'runtime_stale', lifecycle_status: 'active' },
            { id: 'person_unbound', display_name: 'Unbound', legacy_role_id: '', lifecycle_status: 'active' },
            { id: 'person_archived', display_name: 'Archived', legacy_role_id: 'runtime_archived', lifecycle_status: 'archived' }
        ]
    });
    const vcpCoreClient = {
        async listRoles() {
            return [{ id: 'runtime_ready', name: 'Ready Runtime' }];
        },
        async importRole() {
            throw new Error('dry run should not import roles');
        }
    };

    const result = await repairMissingPersonRuntimeRoles({
        personIdentityService,
        vcpCoreClient,
        dryRun: true
    });

    assert.strictEqual(result.dry_run, true);
    assert.strictEqual(result.candidates.length, 2);
    assert.deepStrictEqual(
        result.candidates.map(candidate => ({
            person_id: candidate.person_id,
            previous_role_id: candidate.previous_role_id,
            reason: candidate.reason
        })),
        [
            {
                person_id: 'person_stale',
                previous_role_id: 'runtime_stale',
                reason: 'runtime_missing'
            },
            {
                person_id: 'person_unbound',
                previous_role_id: null,
                reason: 'runtime_unbound'
            }
        ]
    );
    assert.strictEqual(result.repaired.length, 0);
    assert.strictEqual(result.failed.length, 0);
}

async function testRepairRecreatesStaleRuntimeRoleUsingPreviousLegacyId() {
    const personIdentityService = createPersonIdentityService({
        persons: [
            {
                id: 'person_stale',
                display_name: 'Stale Ada',
                legacy_role_id: 'runtime_stale_ada',
                lifecycle_status: 'active',
                memory: { privateNotebook: 'StaleAdaNotes' }
            }
        ]
    });
    const importedPayloads = [];
    const importedRoles = [];
    const vcpCoreClient = {
        async listRoles() {
            return [...importedRoles];
        },
        async importRole(payload) {
            importedPayloads.push(payload);
            const role = {
                id: payload.id || 'generated_runtime',
                name: `${payload.name} Runtime`,
                source: payload.source
            };
            importedRoles.push(role);
            return role;
        }
    };

    const result = await repairMissingPersonRuntimeRoles({
        personIdentityService,
        vcpCoreClient
    });

    assert.strictEqual(result.dry_run, false);
    assert.strictEqual(result.repaired.length, 1);
    assert.strictEqual(result.failed.length, 0);
    assert.strictEqual(importedPayloads.length, 1);
    assert.strictEqual(importedPayloads[0].id, 'runtime_stale_ada');
    assert.strictEqual(importedPayloads[0].memory.owner_type, 'person');
    assert.strictEqual(result.repaired[0].person.legacy_role_id, 'runtime_stale_ada');
    assert.strictEqual(result.repaired[0].runtime_role.id, 'runtime_stale_ada');
}

async function testRepairContinuesAfterSinglePersonFailure() {
    const personIdentityService = createPersonIdentityService({
        persons: [
            { id: 'person_a', display_name: 'Person A', legacy_role_id: 'runtime_a', lifecycle_status: 'active' },
            { id: 'person_b', display_name: 'Person B', legacy_role_id: 'runtime_b', lifecycle_status: 'active' }
        ]
    });
    const vcpCoreClient = {
        async listRoles() {
            return [];
        },
        async importRole(payload) {
            if (payload.id === 'runtime_a') {
                throw new Error('core import failed for runtime_a');
            }
            return {
                id: payload.id,
                name: payload.name,
                source: payload.source
            };
        }
    };

    const result = await repairMissingPersonRuntimeRoles({
        personIdentityService,
        vcpCoreClient
    });

    assert.strictEqual(result.repaired.length, 1);
    assert.strictEqual(result.repaired[0].person.id, 'person_b');
    assert.strictEqual(result.failed.length, 1);
    assert.strictEqual(result.failed[0].person_id, 'person_a');
    assert.match(result.failed[0].error, /core import failed/);
}

async function run() {
    await testDryRunFindsOnlyActivePersonsWithoutUsableRuntimeRole();
    await testRepairRecreatesStaleRuntimeRoleUsingPreviousLegacyId();
    await testRepairContinuesAfterSinglePersonFailure();
    console.log('personRuntimeRoleRepairService.test.js passed');
}

run().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
