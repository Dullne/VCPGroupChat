const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RoleStudioSourceService = require('../src/services/roleStudioSourceService');

function writeAgent(root, division, name, body) {
    const divisionDir = path.join(root, division);
    fs.mkdirSync(divisionDir, { recursive: true });
    fs.writeFileSync(path.join(divisionDir, `${name}.md`), body, 'utf8');
}

function withAgencyFixture(fn) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'role-studio-agency-'));
    fs.writeFileSync(
        path.join(root, 'divisions.json'),
        JSON.stringify({
            divisions: {
                product: { label: 'Product' },
                engineering: { label: 'Engineering' },
                marketing: { label: 'Marketing' }
            }
        }),
        'utf8'
    );
    writeAgent(root, 'product', 'product-manager', [
        '---',
        'name: Product Manager',
        'description: Owns product strategy, requirements, roadmap, and user value.',
        '---',
        '# Product Manager',
        'Turns user and market insight into product decisions, PRDs, prioritization, and launch tradeoffs.'
    ].join('\n'));
    writeAgent(root, 'engineering', 'engineering-ai-engineer', [
        '---',
        'name: AI Engineer',
        'description: Designs and implements production AI systems, APIs, model integration, and code delivery.',
        '---',
        '# AI Engineer',
        'Builds software architecture, backend services, model calls, evaluations, and production code.'
    ].join('\n'));
    writeAgent(root, 'marketing', 'marketing-content-creator', [
        '---',
        'name: Content Creator',
        'description: Produces campaigns, messaging, and content calendars.',
        '---',
        '# Content Creator',
        'Plans marketing content and distribution.'
    ].join('\n'));

    try {
        return fn(root);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
}

async function testChineseProductTechnologyQueryFindsRelevantAgencyTemplates() {
    await withAgencyFixture(async agencyAgentsDir => {
        const service = new RoleStudioSourceService({
            agencyAgentsDir,
            promptxResourceDir: path.join(agencyAgentsDir, 'missing-promptx')
        });
        const result = await service.listSources({
            query: '产品技术',
            limit: 6
        });
        const ids = result.agency_agents.items.map(item => item.id);

        assert.ok(ids.includes('product/product-manager'), 'Chinese product query should include Product Manager');
        assert.ok(ids.includes('engineering/engineering-ai-engineer'), 'Chinese technology query should include AI Engineer');
        assert.ok(
            result.agency_agents.items.every(item => item.score > 0),
            'returned items should be positively scored, not only arbitrary fallbacks'
        );
    });
}

async function run() {
    await testChineseProductTechnologyQueryFindsRelevantAgencyTemplates();
    console.log('roleStudioSourceService.test.js passed');
}

run().catch(error => {
    console.error(error);
    process.exit(1);
});
