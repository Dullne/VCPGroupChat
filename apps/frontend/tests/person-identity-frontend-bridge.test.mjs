import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');

const state = read('js/core/state.js');
assert.match(state, /persons:\s*\[\]/, 'state tracks long-lived persons');
assert.match(state, /roleTemplates:\s*\[\]/, 'state tracks role templates');

const api = read('js/api/person.js');
assert.match(api, /fetchJson\('\/api\/persons'\)/, 'person API can list persons');
assert.match(api, /postJson\('\/api\/persons'/, 'person API can create persons');
assert.match(api, /postJson\('\/api\/persons\/from-template'/, 'person API can create a person from a template');
assert.match(api, /fetchJson\('\/api\/role-templates'\)/, 'person API can list role templates');
assert.match(api, /addTeamPersonMember/, 'person API can add a person to a team');
assert.match(api, /removeTeamPersonMember/, 'person API can remove a person from a team');
assert.match(api, /addGroupPersonMember/, 'person API can add a person to a group profile');
assert.match(api, /removeGroupPersonMember/, 'person API can remove a person from a group profile');
assert.match(api, /person-members/, 'person API uses person membership routes');
assert.match(api, /bindPersonRuntimeRole/, 'person API can bind a long-lived person to a runtime role');
assert.match(api, /\/api\/persons\/.*\/runtime-role/, 'person API uses the runtime-role binding route');
assert.match(api, /generatePersonRuntimeRole/, 'person API can generate a runtime role for a long-lived person');
assert.match(api, /\/api\/persons\/.*\/runtime-role\/generate/, 'person API uses the runtime-role generation route');

const bootstrap = read('js/core/bootstrap-refresh-actions.js');
assert.match(bootstrap, /setPersons/, 'bootstrap refresh accepts a persons setter');
assert.match(bootstrap, /setRoleTemplates/, 'bootstrap refresh accepts a role template setter');
assert.match(bootstrap, /\/api\/persons/, 'bootstrap refresh falls back to the persons API');
assert.match(bootstrap, /\/api\/role-templates/, 'bootstrap refresh falls back to the templates API');

const pool = read('js/ui/workspace-renderers-team-member-pool-core-roles.js');
assert.match(pool, /person_identity/, 'role pool enriches role rows with person identity');
assert.match(pool, /source_template_id/, 'role pool considers source template identity');

const launcher = read('js/ui/workspace-renderers-launcher-role-picker.js');
assert.match(launcher, /长期人物/, 'launcher renders long-lived person copy');
assert.match(launcher, /模板来源/, 'launcher renders template source copy');
assert.match(launcher, /person_identity/, 'launcher consumes person identity metadata');
assert.match(launcher, /badges\.push\('长期人物'/, 'launcher can append the long-lived person badge');
assert.match(launcher, /badges\.push\('模板来源'\)/, 'launcher can append the template source badge');

const teamCard = read('js/ui/workspace-renderers-team-member-card.js');
assert.match(teamCard, /长期人物/, 'team member card distinguishes long-lived people');
assert.match(teamCard, /模板来源/, 'team member card distinguishes templates');
assert.match(teamCard, /badges\.push\('长期人物'/, 'team member card can append the long-lived person badge');
assert.match(teamCard, /badges\.push\('模板来源'\)/, 'team member card can append the template source badge');

const groupCard = read('js/ui/workspace-renderers-group-member-card.js');
assert.match(groupCard, /长期人物/, 'group member card distinguishes long-lived people');
assert.match(groupCard, /模板来源/, 'group member card distinguishes templates');
assert.match(groupCard, /badges\.push\('长期人物'/, 'group member card can append the long-lived person badge');
assert.match(groupCard, /badges\.push\('模板来源'\)/, 'group member card can append the template source badge');

const actionContext = read('js/core/role-library-group-actions-context.js');
assert.match(actionContext, /resolvePersonIdentityForRoleAction/, 'role actions can resolve person identity by role id');
assert.match(actionContext, /legacy_role_id/, 'role actions can map legacy role ids back to people');

const teamAdd = read('js/core/role-library-team-action-add.js');
assert.match(teamAdd, /resolvePersonIdentityForRoleAction/, 'team add checks whether the selected row is a person');
assert.match(teamAdd, /person-members/, 'team add can use the person membership route');
assert.match(teamAdd, /person_id/, 'team add sends person_id for person membership writes');
assert.doesNotMatch(teamAdd, /\/members/, 'team add does not write bare legacy role membership');

const teamRemove = read('js/core/role-library-team-action-remove.js');
assert.match(teamRemove, /resolvePersonIdentityForRoleAction/, 'team remove checks whether the selected row is a person');
assert.match(teamRemove, /person-members/, 'team remove can use the person membership route');
assert.doesNotMatch(teamRemove, /\/members/, 'team remove does not delete through bare legacy role membership');

const groupAdd = read('js/core/role-library-group-action-add.js');
assert.match(groupAdd, /resolvePersonIdentityForRoleAction/, 'group add checks whether the selected row is a person');
assert.match(groupAdd, /person-members/, 'group add can use the person membership route');
assert.match(groupAdd, /person_id/, 'group add sends person_id for person membership writes');
assert.doesNotMatch(groupAdd, /\/members/, 'group add does not write through bare legacy role membership');

const groupRemove = read('js/core/role-library-group-action-remove.js');
assert.match(groupRemove, /resolvePersonIdentityForRoleAction/, 'group remove checks whether the selected row is a person');
assert.match(groupRemove, /person-members/, 'group remove can use the person membership route');
assert.doesNotMatch(groupRemove, /\/members/, 'group remove does not delete through bare legacy role membership');

const bindAction = read('js/core/role-library-person-action-bind-runtime-role.js');
assert.match(bindAction, /createBindPersonRuntimeRoleAction/, 'role library exposes a Person runtime-role binding action');
assert.match(bindAction, /\/api\/persons\/.*\/runtime-role/, 'binding action calls the backend runtime-role route');
assert.match(bindAction, /refreshBootstrap/, 'binding action refreshes bootstrap after binding');

const generateAction = read('js/core/role-library-person-action-generate-runtime-role.js');
assert.match(generateAction, /createGeneratePersonRuntimeRoleAction/, 'role library exposes a Person runtime-role generation action');
assert.match(generateAction, /\/api\/persons\/.*\/runtime-role\/generate/, 'generation action calls the backend runtime-role generation route');
assert.match(generateAction, /refreshBootstrap/, 'generation action refreshes bootstrap after generation');

const repairAction = read('js/core/role-library-person-action-repair-runtime-roles.js');
assert.match(repairAction, /createRepairPersonRuntimeRolesAction/, 'role library exposes a bulk Person runtime-role repair action');
assert.match(repairAction, /\/api\/person-runtime-roles\/repair/, 'repair action calls the backend bulk repair route');
assert.match(repairAction, /refreshBootstrap/, 'repair action refreshes bootstrap after repairing runtime bindings');

const enrichAction = read('js/core/role-library-person-action-enrich-profiles.js');
assert.match(enrichAction, /createEnrichSparsePersonProfilesAction/, 'role library exposes a bulk Person profile enrichment action');
assert.match(enrichAction, /\/api\/person-profiles\/enrich/, 'profile enrichment action calls the backend bulk enrichment route');
assert.match(enrichAction, /sync_runtime/, 'profile enrichment action asks the product backend to sync runtime roles');
assert.match(enrichAction, /refreshBootstrap/, 'profile enrichment action refreshes bootstrap after enriching profiles');

const roleLibraryActions = read('js/core/role-library-actions.js');
assert.match(roleLibraryActions, /createBindPersonRuntimeRoleAction/, 'role library includes the Person binding action');
assert.match(roleLibraryActions, /createGeneratePersonRuntimeRoleAction/, 'role library includes the Person generation action');
assert.match(roleLibraryActions, /createRepairPersonRuntimeRolesAction/, 'role library includes the bulk Person runtime-role repair action');
assert.match(roleLibraryActions, /createEnrichSparsePersonProfilesAction/, 'role library includes the bulk Person profile enrichment action');

const roleLibraryBridge = read('js/core/app-runtime-bridge-interaction-role-library.js');
assert.match(roleLibraryBridge, /bindPersonRuntimeRole/, 'runtime bridge exposes the Person binding action to renderers');
assert.match(roleLibraryBridge, /generatePersonRuntimeRole/, 'runtime bridge exposes the Person generation action to renderers');
assert.match(roleLibraryBridge, /repairMissingRuntimeRoles/, 'runtime bridge exposes the bulk Person runtime repair action to renderers');
assert.match(roleLibraryBridge, /enrichSparseProfiles/, 'runtime bridge exposes the bulk Person profile enrichment action to renderers');
assert.match(roleLibraryBridge, /personRuntimeActions/, 'runtime bridge groups Person runtime actions for renderer wiring');

const rendererFactory = read('js/core/workspace-runtime-renderers-factory.js');
assert.match(rendererFactory, /personRuntimeActions/, 'workspace renderer factory passes grouped Person runtime actions');

const rendererDeps = read('js/ui/workspace-renderers-deps-group.js');
assert.match(rendererDeps, /personRuntimeActions/, 'workspace renderer deps pass grouped Person runtime actions into member pools');

const personBindingRenderer = read('js/ui/workspace-renderers-person-runtime-binding.js');
assert.match(personBindingRenderer, /待绑定运行时人物/, 'Person binding renderer labels people as needing runtime binding');
assert.match(personBindingRenderer, /runtime-role-select/, 'Person binding renderer creates a runtime role select');
assert.match(personBindingRenderer, /绑定运行时角色/, 'Person binding renderer exposes the bind command');
assert.match(personBindingRenderer, /生成运行时角色/, 'Person binding renderer exposes the generate command');
assert.match(personBindingRenderer, /一键生成缺失运行时/, 'Person binding renderer exposes the bulk repair command');
assert.match(personBindingRenderer, /待补全人物档案/, 'Person binding renderer labels sparse long-lived profiles');
assert.match(personBindingRenderer, /一键补全人物档案/, 'Person binding renderer exposes the bulk profile enrichment command');
assert.match(personBindingRenderer, /personRuntimeActions/, 'Person binding renderer consumes grouped Person runtime actions');

const teamPool = read('js/ui/workspace-renderers-team-member-pool.js');
assert.match(teamPool, /renderUnboundPersonRuntimeBindingSection/, 'team member pool renders the unbound long-lived Person section');
assert.match(teamPool, /personRuntimeActions/, 'team member pool passes grouped Person runtime actions');

const groupPool = read('js/ui/workspace-renderers-group-member-pool.js');
assert.match(groupPool, /renderUnboundPersonRuntimeBindingSection/, 'group member pool renders the unbound long-lived Person section');
assert.match(groupPool, /personRuntimeActions/, 'group member pool passes grouped Person runtime actions');

console.log('person identity frontend bridge static checks passed');
