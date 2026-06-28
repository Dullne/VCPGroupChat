const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

async function loadModule() {
    const modulePath = path.join(__dirname, '../scripts/project-assets-to-hcc.mjs');
    return import(pathToFileURL(modulePath).href);
}

function createConfirmedProjectSynthesis() {
    return {
        id: 'synthesis_a',
        session_id: 'sess_a',
        round_index: 3,
        conversation_policy: 'project',
        source_message_ids: ['msg_user', 'msg_architect'],
        memory_deposition: {
            items: [
                {
                    content: 'This memory item must not become a task.'
                }
            ]
        },
        project_assets: {
            confirmed: true,
            confirmed_by: '项目负责人',
            decisions: [
                {
                    title: 'Project assets require explicit confirmation',
                    status: 'accepted'
                }
            ],
            recommended_tasks: [
                {
                    title: 'Add backlog bridge smoke',
                    content: 'Create a dry-run bridge from confirmed project assets to hcc tasks.',
                    team_role: 'integration',
                    priority: 90,
                    source_message_ids: ['msg_architect']
                }
            ]
        }
    };
}

async function testBuildsHccTaskSpecsFromConfirmedProjectAssets() {
    const { buildHccTaskSpecsFromSynthesis } = await loadModule();
    const specs = buildHccTaskSpecsFromSynthesis(createConfirmedProjectSynthesis(), {
        parentTaskId: 68
    });

    assert.equal(specs.length, 1);
    assert.equal(specs[0].title, 'Add backlog bridge smoke');
    assert.deepEqual(specs[0].args.slice(0, 4), ['task', 'create', '--title', 'Add backlog bridge smoke']);
    assert.ok(specs[0].args.includes('--parent'));
    assert.ok(specs[0].args.includes('68'));
    assert.ok(specs[0].args.includes('--team-role'));
    assert.ok(specs[0].args.includes('integration'));
    assert.match(specs[0].body, /synthesis_a/);
    assert.match(specs[0].body, /sess_a/);
    assert.match(specs[0].body, /msg_architect/);
    assert.doesNotMatch(specs[0].body, /This memory item must not become a task/);
}

async function testRejectsUnconfirmedProjectAssets() {
    const { buildHccTaskSpecsFromSynthesis } = await loadModule();
    const synthesis = createConfirmedProjectSynthesis();
    synthesis.project_assets.confirmed = false;

    assert.throws(
        () => buildHccTaskSpecsFromSynthesis(synthesis),
        /project_assets must be confirmed before creating hcc tasks/
    );
}

async function testRejectsCasualPolicyEvenWhenAssetsAreConfirmed() {
    const { buildHccTaskSpecsFromSynthesis } = await loadModule();
    const synthesis = createConfirmedProjectSynthesis();
    synthesis.conversation_policy = 'ordinary';

    assert.throws(
        () => buildHccTaskSpecsFromSynthesis(synthesis),
        /only project or decision syntheses can create hcc tasks/
    );
}

async function testRejectsConfirmedAssetsWithoutRecommendedTasks() {
    const { buildHccTaskSpecsFromSynthesis } = await loadModule();
    const synthesis = createConfirmedProjectSynthesis();
    synthesis.project_assets.recommended_tasks = [];

    assert.throws(
        () => buildHccTaskSpecsFromSynthesis(synthesis),
        /confirmed project_assets contain no recommended_tasks/
    );
}

function testServerExposesConfirmedProjectAssetsBridgeRoute() {
    const serverSource = fs.readFileSync(
        path.join(__dirname, '../src/server.js'),
        'utf8'
    );

    assert.match(
        serverSource,
        /\/api\/group-chat\/sessions\/:id\/round-syntheses\/:roundIndex\/project-assets\/hcc\/confirm/,
        'server exposes a project asset confirmation endpoint'
    );
    assert.match(
        serverSource,
        /confirmRoundSynthesisProjectAssets/,
        'server confirms project assets before returning hcc bridge commands'
    );
    assert.match(
        serverSource,
        /buildProjectAssetsHccBridgePayload/,
        'server returns host-side hcc bridge command metadata'
    );
}

async function run() {
    await testBuildsHccTaskSpecsFromConfirmedProjectAssets();
    await testRejectsUnconfirmedProjectAssets();
    await testRejectsCasualPolicyEvenWhenAssetsAreConfirmed();
    await testRejectsConfirmedAssetsWithoutRecommendedTasks();
    testServerExposesConfirmedProjectAssetsBridgeRoute();
    console.log('projectAssetsToHcc.test.js passed');
}

run().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
