import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = relativePath => readFileSync(join(repoRoot, relativePath), 'utf8');

const indexHtml = read('index.html');
assert.match(indexHtml, /id="start-team-draft-btn"/, 'team workspace exposes an explicit new-team draft action');
assert.match(indexHtml, /id="copy-default-team-members-btn"/, 'team workspace exposes explicit default-team member copy');
assert.match(indexHtml, /创建团队并加入 0 人/, 'create button communicates member count before submission');
assert.match(indexHtml, /先选人物，再创建团队/, 'team member column uses draft-first creation copy');

const stateSource = read('js/core/state.js');
assert.match(stateSource, /teamDraftMode:\s*false/, 'state tracks whether the team workspace is drafting a new team');
assert.match(stateSource, /teamDraftSelectedRoleIds:\s*new Set\(\)/, 'state stores selected draft members separately from persisted teams');

const accessorsSource = read('js/core/app-state-accessors-workspace-values.js');
assert.match(accessorsSource, /getTeamDraftMode/, 'workspace accessors expose draft mode');
assert.match(accessorsSource, /setTeamDraftMode/, 'workspace accessors can set draft mode');
assert.match(accessorsSource, /getTeamDraftSelectedRoleIds/, 'workspace accessors expose selected draft role ids');
assert.match(accessorsSource, /clearTeamDraftSelectedRoleIds/, 'workspace accessors can clear selected draft role ids');

const workspaceActions = read('js/core/workspace-team-actions.js');
assert.match(workspaceActions, /createWorkspaceTeamDraftActions/, 'workspace team actions include draft actions');
assert.match(workspaceActions, /startTeamDraft/, 'workspace actions expose startTeamDraft');
assert.match(workspaceActions, /copyDefaultTeamMembersToDraft/, 'workspace actions expose default-team copy');

const draftActions = read('js/core/workspace-team-draft-actions.js');
assert.match(draftActions, /team_person_members_by_team_id/, 'default-team copy reads bootstrap team person member buckets');
assert.match(draftActions, /default_team_id/, 'default-team copy is explicitly sourced from the default team');
assert.match(draftActions, /setTeamDraftMode\(true\)/, 'starting or copying members enters draft mode');
assert.match(draftActions, /clearTeamDraftSelectedRoleIds\(\)/, 'starting a fresh draft clears stale selected members');

const roleDraftActions = read('js/core/role-library-team-draft-actions.js');
assert.match(roleDraftActions, /addRoleToTeamDraft/, 'role library can add a role to the team draft');
assert.match(roleDraftActions, /removeRoleFromTeamDraft/, 'role library can remove a role from the team draft');
assert.match(roleDraftActions, /setTeamDraftSelectedRoleIds\(new Set/, 'draft role actions replace the Set immutably for render refresh');

const createAction = read('js/core/workspace-team-create-action.js');
assert.match(createAction, /getTeamDraftMode/, 'create action requires draft mode');
assert.match(createAction, /getTeamDraftSelectedRoleIds/, 'create action reads selected draft members');
assert.match(createAction, /请先选择至少 1 个团队人物/, 'create action prevents empty team creation');
assert.match(createAction, /person-members/, 'create action preserves person membership writes');
assert.doesNotMatch(createAction, /\/members/, 'create action does not write bare legacy role team members');
assert.match(createAction, /草稿人物未自动加入/, 'duplicate team names do not add draft members to an existing team');
assert.doesNotMatch(createAction, /default_team_id[\s\S]*POST \/api\/teams/, 'create action does not auto-seed from the default team');

const rendererFactory = read('js/core/workspace-runtime-renderers-factory.js');
assert.match(rendererFactory, /getTeamDraftMode/, 'workspace renderer factory passes draft mode');
assert.match(rendererFactory, /addRoleToTeamDraft/, 'workspace renderer factory passes draft add action');
assert.match(rendererFactory, /copyDefaultTeamMembersToDraft/, 'workspace renderer factory passes default copy action');

const rendererDepsCore = read('js/ui/workspace-renderers-deps-core.js');
assert.match(rendererDepsCore, /teamListDeps:[\s\S]*getTeamDraftMode/, 'team list receives draft mode');
assert.match(rendererDepsCore, /teamSummaryDeps:[\s\S]*getTeamDraftSelectedRoleIds/, 'team summary receives selected draft ids');
assert.match(rendererDepsCore, /teamFormStatusDeps:[\s\S]*getTeamDraftSelectedRoleIds/, 'team form status receives selected draft ids');

const rendererDepsGroup = read('js/ui/workspace-renderers-deps-group.js');
assert.match(rendererDepsGroup, /teamMemberPoolDeps:[\s\S]*addRoleToTeamDraft/, 'team member pool receives draft add action');
assert.match(rendererDepsGroup, /teamMemberPoolDeps:[\s\S]*removeRoleFromTeamDraft/, 'team member pool receives draft remove action');

const teamListRenderer = read('js/ui/workspace-renderers-team-list.js');
assert.match(teamListRenderer, /team-draft-card/, 'team list renders a draft row');
assert.match(teamListRenderer, /setTeamDraftMode\?\.\(false\)/, 'selecting an existing team exits draft mode');

const teamPoolRenderer = read('js/ui/workspace-renderers-team-member-pool.js');
assert.match(teamPoolRenderer, /团队草稿：已选/, 'team member pool renders draft status');
assert.match(teamPoolRenderer, /已选人物/, 'team member pool renders selected draft people');
assert.match(teamPoolRenderer, /可加入人物/, 'team member pool renders available draft people');
assert.match(teamPoolRenderer, /加入草稿/, 'team member card can add to draft');
assert.match(teamPoolRenderer, /移出草稿/, 'team member card can remove from draft');

const eventBindings = read('js/core/ui-event-bindings-team-session.js');
assert.match(eventBindings, /startTeamDraftBtn/, 'team events bind the new-team draft button');
assert.match(eventBindings, /copyDefaultTeamMembersBtn/, 'team events bind the default-team copy button');

console.log('team draft flow smoke checks passed');
