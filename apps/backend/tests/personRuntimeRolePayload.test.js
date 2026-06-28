const assert = require('assert');

const {
    buildPersonRuntimeRoleImportPayload
} = require('../src/services/personRuntimeRolePayload');

function testBuildsRuntimeRoleImportPayloadFromPersonMemoryAndTemplate() {
    const payload = buildPersonRuntimeRoleImportPayload({
        person: {
            id: 'person_ada',
            display_name: 'Ada',
            description: 'A long-lived product engineer.',
            personality: 'Curious, direct, careful.',
            emotional_style: 'Warm under pressure.',
            voice_style: 'Concise and grounded.',
            memory: {
                privateNotebook: 'Ada私人笔记',
                stableFacts: ['prefers source-backed decisions']
            },
            model_preferences: {
                model: 'gpt-5.4',
                temperature: 0.35,
                output_tokens: 900
            },
            source_template_id: 'tpl_ai_engineer'
        },
        template: {
            id: 'tpl_ai_engineer',
            source: 'agency-agents',
            external_id: 'engineering/ai-engineer',
            name: 'AI Engineer',
            description: 'Professional template, not a person.',
            template_content: '# AI Engineer\nBuilds AI features.',
            defaults: {
                model: 'gpt-5-mini',
                max_tokens: 1200,
                responsibilities: ['Design AI systems']
            }
        }
    });

    assert.strictEqual(payload.name, 'Ada');
    assert.strictEqual(payload.source, 'groupchat_person');
    assert.strictEqual(payload.description, 'A long-lived product engineer.');
    assert.strictEqual(payload.model, 'gpt-5.4');
    assert.strictEqual(payload.temperature, 0.35);
    assert.strictEqual(payload.output_tokens, 900);
    assert.strictEqual(payload.max_tokens, 1200);
    assert.deepStrictEqual(payload.responsibilities, ['Design AI systems']);
    assert.strictEqual(payload.memory.privateNotebook, 'Ada私人笔记');
    assert.strictEqual(payload.memory.owner_type, 'person');
    assert.strictEqual(payload.memory.owner_id, 'person_ada');
    assert.match(payload.persona, /Curious, direct, careful/);
    assert.match(payload.voice_style, /Concise and grounded/);
    assert.match(payload.template_content, /长期人物：Ada/);
    assert.match(payload.template_content, /人物私有记忆入口：\{\{Ada私人笔记\}\}/);
    assert.match(payload.template_content, /模板来源：AI Engineer/);
    assert.match(payload.template_content, /agency-agents\/engineering\/ai-engineer/);
    assert.match(payload.template_content, /# AI Engineer/);
    assert.match(payload.invite_prompt, /接下来请作为Ada发言/);
}

function testDoesNotTreatTemplateAsMemoryOwner() {
    const payload = buildPersonRuntimeRoleImportPayload({
        person: {
            id: 'person_lin',
            display_name: 'Lin',
            memory: {},
            source_template_id: 'tpl_backend'
        },
        template: {
            id: 'tpl_backend',
            name: 'Backend Architect',
            template_content: 'Backend template'
        }
    });

    assert.strictEqual(payload.memory.privateNotebook, 'Lin');
    assert.strictEqual(payload.memory.owner_type, 'person');
    assert.strictEqual(payload.memory.owner_id, 'person_lin');
    assert.ok(!payload.memory.template_id, 'template id must not become the memory owner');
}

function testRequiresPersonName() {
    assert.throws(
        () => buildPersonRuntimeRoleImportPayload({ person: { id: 'person_empty' } }),
        /person display_name is required/
    );
}

testBuildsRuntimeRoleImportPayloadFromPersonMemoryAndTemplate();
testDoesNotTreatTemplateAsMemoryOwner();
testRequiresPersonName();
console.log('personRuntimeRolePayload.test.js checks passed');
