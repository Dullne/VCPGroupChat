const assert = require('assert');

const {
    generatePersonRuntimeRole
} = require('../src/services/personRuntimeRoleGenerationService');

async function testGeneratesRuntimeRoleAndBindsItBackToPerson() {
    const calls = [];
    const person = {
        id: 'person_ada',
        display_name: 'Ada',
        source_template_id: 'tpl_ai_engineer',
        description: 'Long-lived AI product engineer.',
        personality: 'Precise and collaborative.',
        memory: { privateNotebook: 'AdaNotes' },
        model_preferences: { model: 'gpt-5.4' }
    };
    const template = {
        id: 'tpl_ai_engineer',
        source: 'agency-agents',
        external_id: 'engineering/ai-engineer',
        name: 'AI Engineer',
        template_content: '# AI Engineer'
    };
    let importedPayload = null;

    const personIdentityService = {
        getPerson(personId) {
            calls.push(['getPerson', personId]);
            return personId === person.id ? person : null;
        },
        getRoleTemplate(templateId) {
            calls.push(['getRoleTemplate', templateId]);
            return templateId === template.id ? template : null;
        },
        bindPersonRuntimeRole(personId, payload) {
            calls.push(['bindPersonRuntimeRole', personId, payload]);
            assert.strictEqual(personId, person.id);
            assert.deepStrictEqual(payload, {
                role_id: 'runtime_ada',
                role_name: 'Ada Runtime'
            });
            return {
                ...person,
                legacy_role_id: payload.role_id
            };
        }
    };

    const vcpCoreClient = {
        async importRole(payload) {
            calls.push(['importRole', payload.name]);
            importedPayload = payload;
            return {
                id: 'runtime_ada',
                name: 'Ada Runtime',
                source: 'groupchat_person'
            };
        }
    };

    const result = await generatePersonRuntimeRole({
        personId: person.id,
        overrides: { temperature: 0.2 },
        personIdentityService,
        vcpCoreClient
    });

    assert.deepStrictEqual(calls.map(call => call[0]), [
        'getPerson',
        'getRoleTemplate',
        'importRole',
        'bindPersonRuntimeRole'
    ]);
    assert.strictEqual(importedPayload.name, 'Ada');
    assert.strictEqual(importedPayload.source, 'groupchat_person');
    assert.strictEqual(importedPayload.temperature, 0.2);
    assert.strictEqual(importedPayload.memory.owner_type, 'person');
    assert.strictEqual(importedPayload.memory.owner_id, 'person_ada');
    assert.match(importedPayload.template_content, /模板来源：AI Engineer/);
    assert.strictEqual(result.person.legacy_role_id, 'runtime_ada');
    assert.strictEqual(result.runtime_role.id, 'runtime_ada');
}

async function testReportsMissingPersonAsNotFound() {
    await assert.rejects(
        () => generatePersonRuntimeRole({
            personId: 'person_missing',
            personIdentityService: {
                getPerson() {
                    return null;
                }
            },
            vcpCoreClient: {
                async importRole() {
                    throw new Error('should not import when person is missing');
                }
            }
        }),
        error => error.status === 404 && /person not found/.test(error.message)
    );
}

async function testReportsCoreImportWithoutRoleIdAsGatewayError() {
    await assert.rejects(
        () => generatePersonRuntimeRole({
            personId: 'person_ada',
            personIdentityService: {
                getPerson() {
                    return { id: 'person_ada', display_name: 'Ada' };
                },
                getRoleTemplate() {
                    return null;
                },
                bindPersonRuntimeRole() {
                    throw new Error('should not bind when core import has no id');
                }
            },
            vcpCoreClient: {
                async importRole() {
                    return { name: 'Ada Runtime' };
                }
            }
        }),
        error => (
            error.status === 502
            && /core role import did not return a role id/.test(error.message)
            && error.payload?.role?.name === 'Ada Runtime'
        )
    );
}

(async () => {
    await testGeneratesRuntimeRoleAndBindsItBackToPerson();
    await testReportsMissingPersonAsNotFound();
    await testReportsCoreImportWithoutRoleIdAsGatewayError();
    console.log('personRuntimeRoleGenerationService.test.js checks passed');
})();
