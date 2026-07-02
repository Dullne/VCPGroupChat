import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getWorkspaceTeamMemberPoolCoreRoles } from '../js/ui/workspace-renderers-team-member-pool-core-roles.js';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = relativePath => readFileSync(join(repoRoot, relativePath), 'utf8');

function testTeamPoolOnlyListsLongLivedPersons() {
    const roles = getWorkspaceTeamMemberPoolCoreRoles({
        roles: [
            { id: 'runtime_person_a', name: '人物甲', source: 'role_studio' },
            { id: 'agency_template_only', name: '模板甲', source: 'agency_agents' },
            { id: 'native_runtime_only', name: '裸运行时', source: 'vcp_agent' },
            { id: 'ephemeral_a', name: '临时角色', source: 'ephemeral' }
        ],
        persons: [
            {
                id: 'person_a',
                display_name: '人物甲',
                legacy_role_id: 'runtime_person_a',
                lifecycle_status: 'active'
            }
        ],
        role_templates: [
            {
                id: 'tpl_agency',
                external_id: 'agency_template_only',
                name: '模板甲'
            }
        ]
    });

    assert.deepStrictEqual(
        roles.map(role => role.id),
        ['runtime_person_a'],
        'team pool lists only runtime roles backed by long-lived people'
    );
    assert.strictEqual(roles[0].identity_kind, 'person');
    assert.strictEqual(roles[0].person_identity.id, 'person_a');
}

function testTeamPoolProductActionsDoNotFallbackToLegacyRoleMembership() {
    const teamAdd = read('js/core/role-library-team-action-add.js');
    const teamRemove = read('js/core/role-library-team-action-remove.js');
    const teamCreate = read('js/core/workspace-team-create-action.js');
    const teamDraft = read('js/core/workspace-team-draft-actions.js');
    const teamCard = read('js/ui/workspace-renderers-team-member-card.js');

    assert.doesNotMatch(
        teamAdd,
        /\/api\/teams\/\$\{encodeURIComponent\(teamId\)\}\/members/,
        'team add action does not write bare legacy runtime team members'
    );
    assert.doesNotMatch(
        teamRemove,
        /\/api\/teams\/\$\{encodeURIComponent\(teamId\)\}\/members/,
        'team remove action does not remove through bare legacy runtime team members'
    );
    assert.doesNotMatch(
        teamCreate,
        /\/api\/teams\/\$\{encodeURIComponent\(teamId\)\}\/members/,
        'team create action does not add draft members through bare legacy runtime team members'
    );
    assert.match(
        teamDraft,
        /team_person_members_by_team_id/,
        'copying default members uses Team Person Pool buckets from bootstrap'
    );
    assert.match(
        teamCard,
        /runtime_binding_status/,
        'team pool cards inspect runtime binding status before adding people'
    );
    assert.match(
        teamCard,
        /先绑定运行时/,
        'team pool cards ask for runtime binding before adding unavailable people'
    );
}

function testRuntimeBindingSectionIncludesMissingRuntimeBindings() {
    const runtimeBinding = read('js/ui/workspace-renderers-person-runtime-binding.js');
    assert.match(
        runtimeBinding,
        /getPersonsNeedingRuntimeBinding/,
        'runtime binding section has an explicit person-first binding selector'
    );
    assert.match(
        runtimeBinding,
        /runtimeRoleIds/,
        'runtime binding section compares person legacy ids with actual runtime role ids'
    );
    assert.match(
        runtimeBinding,
        /待绑定运行时人物/,
        'runtime binding section labels people as missing runtime binding, not missing person identity'
    );
    assert.match(
        runtimeBinding,
        /这些长期人物缺少可用运行时角色/,
        'runtime binding section explains that only runtime capability is missing'
    );
    assert.match(
        runtimeBinding,
        /repairMissingRuntimeRoles/,
        'runtime binding section can call the bulk runtime repair action'
    );
    assert.match(
        runtimeBinding,
        /一键生成缺失运行时/,
        'runtime binding section exposes a bulk runtime generation command'
    );
    assert.doesNotMatch(
        runtimeBinding,
        /未绑定长期人物/,
        'runtime binding section must not imply the long-lived person identity is missing'
    );
    assert.doesNotMatch(
        runtimeBinding,
        /绑定后会作为长期人物/,
        'runtime binding section must not imply binding creates the long-lived person identity'
    );
}

function testRuntimeBindingSectionIncludesSparseProfileEnrichment() {
    const runtimeBinding = read('js/ui/workspace-renderers-person-runtime-binding.js');
    assert.match(
        runtimeBinding,
        /getPersonsNeedingProfileEnrichment/,
        'person runtime section has an explicit sparse profile selector'
    );
    assert.match(
        runtimeBinding,
        /description.*personality.*emotional_style.*voice_style/s,
        'sparse profile selector checks long-lived person profile fields'
    );
    assert.match(
        runtimeBinding,
        /待补全人物档案/,
        'person runtime section labels sparse profiles separately from runtime binding'
    );
    assert.match(
        runtimeBinding,
        /一键补全人物档案/,
        'person runtime section exposes a bulk profile enrichment command'
    );
    assert.match(
        runtimeBinding,
        /enrichSparseProfiles/,
        'person runtime section calls the profile enrichment action'
    );
}

testTeamPoolOnlyListsLongLivedPersons();
testTeamPoolProductActionsDoNotFallbackToLegacyRoleMembership();
testRuntimeBindingSectionIncludesMissingRuntimeBindings();
testRuntimeBindingSectionIncludesSparseProfileEnrichment();
console.log('team-person-pool.test.mjs passed');
