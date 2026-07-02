import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getWorkspaceTeamMemberPoolCoreRoles } from '../js/ui/workspace-renderers-team-member-pool-core-roles.js';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = relativePath => readFileSync(join(repoRoot, relativePath), 'utf8');

const state = read('js/core/state.js');
assert.match(state, /launcherSelectedPersonIds/, 'launcher selection state stores person ids');

const index = read('index.html');
assert.match(index, /人物通讯录/, 'launcher copy names the picker as a person address book');
assert.match(index, /搜索人物/, 'launcher search label is person-first');
assert.doesNotMatch(index, new RegExp(['底层角色', '池'].join('')), 'launcher copy does not expose role-pool implementation wording');

const accessors = read('js/core/app-state-accessors-workspace-values.js');
assert.match(accessors, /getLauncherSelectedPersonIds/, 'workspace accessors expose selected person ids');
assert.match(accessors, /setLauncherSelectedPersonIds/, 'workspace accessors set selected person ids');
assert.match(accessors, /clearLauncherSelectedPersonIds/, 'workspace accessors clear selected person ids');

const renderer = read('js/ui/workspace-renderers-launcher-role-picker.js');
assert.match(renderer, /person_identity/, 'launcher renders person-backed cards');
assert.match(renderer, /person_identity\.id/, 'launcher toggles by person identity id');
assert.doesNotMatch(renderer, /selectedRoleIds/, 'launcher no longer uses role id selection naming');

const createAction = read('js/core/workspace-profile-create-form-action.js');
assert.match(createAction, /person_members|personMembers/, 'launcher create submits person members');
assert.match(createAction, /person_id/, 'launcher create sends person_id');
assert.match(createAction, /getWorkspaceTeamMemberPoolCoreRoles/, 'launcher create validates against person-first candidates');
assert.match(createAction, /runtime_binding_status/, 'launcher create only submits runtime-ready people');
assert.doesNotMatch(
    createAction,
    /\/api\/teams\/\$\{encodeURIComponent\(managedTeam\.id\)\}\/members/,
    'launcher create does not add bare runtime team members'
);
assert.doesNotMatch(
    createAction,
    /role_id:\s*roleId/,
    'launcher create does not submit role_id members'
);

const modeRenderer = read('js/ui/workspace-renderers-mode.js');
assert.doesNotMatch(modeRenderer, /从角色库选择 AI 成员/, 'launcher mode subtitle does not present runtime roles as launch members');

const liveShapeBootstrap = {
    persons: [
        {
            id: 'person_strategy',
            display_name: '产品技术统筹',
            legacy_role_id: 'legacy_strategy_role',
            lifecycle_status: 'active',
            description: '负责产品和技术路线统一'
        },
        {
            id: 'person_unbound',
            display_name: '未绑定研究员',
            legacy_role_id: '',
            lifecycle_status: 'active',
            description: '还没有运行时角色'
        },
        {
            id: 'person_archived',
            display_name: '归档成员',
            legacy_role_id: 'archived_role',
            lifecycle_status: 'archived'
        }
    ],
    roles: [
        {
            id: 'unrelated_runtime_role',
            name: '不相关运行时角色',
            source: 'vcp_agent',
            tag: 'runtime'
        }
    ]
};
const launcherCandidates = getWorkspaceTeamMemberPoolCoreRoles(liveShapeBootstrap);
assert.equal(launcherCandidates.length, 2, 'launcher candidates come from active persons even when runtime roles do not match');
const staleRuntimePerson = launcherCandidates.find(item => item.person_identity?.id === 'person_strategy');
assert.ok(staleRuntimePerson, 'stale runtime-bound person is still visible in the launcher');
assert.equal(staleRuntimePerson.runtime_binding_status, 'missing_runtime', 'stale legacy role is marked as missing runtime');
const unboundRuntimePerson = launcherCandidates.find(item => item.person_identity?.id === 'person_unbound');
assert.ok(unboundRuntimePerson, 'unbound person is still visible in the launcher');
assert.equal(unboundRuntimePerson.runtime_binding_status, 'unbound_runtime', 'person without a legacy runtime role is marked unbound');
assert.ok(!launcherCandidates.some(item => item.person_identity?.id === 'person_archived'), 'archived persons stay out of launcher candidates');

console.log('person-first-launcher.test.mjs passed');
