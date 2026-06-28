const assert = require('assert');

const { toRoleSummary, toRoleSummaries } = require('../src/services/roleSummary');

function testRoleSummaryOmitsHeavyRoleFields() {
    const role = {
        id: 'agency_engineering_engineering_ai_engineer',
        name: 'AI Engineer',
        source: 'agency_agents',
        description: 'Builds production AI systems.',
        avatar: '',
        tag: 'engineering,ai',
        active: true,
        model: 'qwen/test',
        temperature: 0.7,
        max_tokens: 1000000,
        output_tokens: 2048,
        context_token_limit: 1000000,
        persona: 'Very long persona text that belongs in the detail payload.',
        responsibilities: ['AI integration'],
        collaboration_guide: 'Long collaboration guide.',
        voice_style: 'Concise',
        invite_prompt: 'Please speak as AI Engineer.',
        template_content: '# Huge template',
        role_spec: {
            name: 'AI Engineer',
            description: 'Builds production AI systems.',
            persona: 'Duplicated persona',
            template_content: '# Duplicated huge template',
            model: 'qwen/test'
        },
        metadata: {
            external_id: 'engineering/engineering-ai-engineer'
        },
        is_native: false
    };

    const summary = toRoleSummary(role);

    assert.deepStrictEqual(summary, {
        id: 'agency_engineering_engineering_ai_engineer',
        name: 'AI Engineer',
        source: 'agency_agents',
        description: 'Builds production AI systems.',
        avatar: '',
        tag: 'engineering,ai',
        active: true,
        model: 'qwen/test',
        temperature: 0.7,
        max_tokens: 1000000,
        output_tokens: 2048,
        context_token_limit: 1000000,
        responsibilities: ['AI integration'],
        metadata: {
            external_id: 'engineering/engineering-ai-engineer'
        },
        is_native: false,
        details_loaded: false
    });
    assert.ok(!Object.prototype.hasOwnProperty.call(summary, 'persona'));
    assert.ok(!Object.prototype.hasOwnProperty.call(summary, 'template_content'));
    assert.ok(!Object.prototype.hasOwnProperty.call(summary, 'role_spec'));
    assert.ok(!Object.prototype.hasOwnProperty.call(summary, 'collaboration_guide'));
    assert.ok(!Object.prototype.hasOwnProperty.call(summary, 'voice_style'));
    assert.ok(!Object.prototype.hasOwnProperty.call(summary, 'invite_prompt'));
}

function testRoleSummariesNormalizeArrays() {
    assert.deepStrictEqual(toRoleSummaries(null), []);
    assert.deepStrictEqual(
        toRoleSummaries([
            { id: 'a', name: 'A', description: 'first' },
            { id: 'b', name: 'B', description: 'second', role_spec: { template_content: 'heavy' } }
        ]).map(role => role.id),
        ['a', 'b']
    );
}

function testRoleSummariesCanAttachPersonAndTemplateIdentity() {
    const summaries = toRoleSummaries([
        {
            id: 'runtime_ada',
            name: 'Runtime Ada',
            source: 'groupchat_person',
            description: 'runtime role'
        }
    ], {
        persons: [
            {
                id: 'person_ada',
                display_name: 'Ada',
                legacy_role_id: 'runtime_ada',
                source_template_id: 'tpl_architect',
                memory: { privateNotebook: 'AdaNotebook' }
            }
        ],
        roleTemplates: [
            {
                id: 'tpl_architect',
                name: 'Architect Template',
                source: 'agency_agents',
                external_id: 'engineering/software-architect'
            }
        ]
    });

    assert.strictEqual(summaries[0].identity_kind, 'person');
    assert.deepStrictEqual(summaries[0].person_identity, {
        id: 'person_ada',
        display_name: 'Ada',
        legacy_role_id: 'runtime_ada',
        source_template_id: 'tpl_architect',
        identity_kind: 'person'
    });
    assert.deepStrictEqual(summaries[0].role_template_identity, {
        id: 'tpl_architect',
        name: 'Architect Template',
        source: 'agency_agents',
        external_id: 'engineering/software-architect'
    });
    assert.strictEqual(summaries[0].source_template_id, 'tpl_architect');
    assert.ok(!Object.prototype.hasOwnProperty.call(summaries[0].person_identity, 'memory'));
}

function testRoleSummariesPreferRealPersonOverLegacyCompatibilityPerson() {
    const summaries = toRoleSummaries([
        {
            id: 'runtime_ada',
            name: 'Runtime Ada',
            source: 'groupchat_person'
        }
    ], {
        persons: [
            {
                id: 'person_ada',
                display_name: 'Ada',
                legacy_role_id: 'runtime_ada',
                source_template_id: 'tpl_architect',
                identity_kind: 'person'
            },
            {
                id: 'person_legacy_runtime_ada',
                display_name: 'Legacy Ada',
                legacy_role_id: 'runtime_ada',
                identity_kind: 'legacy_person'
            }
        ],
        roleTemplates: [
            {
                id: 'tpl_architect',
                name: 'Architect Template',
                source: 'agency_agents',
                external_id: 'engineering/software-architect'
            }
        ]
    });

    assert.strictEqual(summaries[0].identity_kind, 'person');
    assert.strictEqual(summaries[0].person_identity.id, 'person_ada');
    assert.strictEqual(summaries[0].role_template_identity.id, 'tpl_architect');
}

testRoleSummaryOmitsHeavyRoleFields();
testRoleSummariesNormalizeArrays();
testRoleSummariesCanAttachPersonAndTemplateIdentity();
testRoleSummariesPreferRealPersonOverLegacyCompatibilityPerson();
console.log('roleSummary.test.js passed');
