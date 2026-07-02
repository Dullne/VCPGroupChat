# Person-First Launcher And Role Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make launcher, group membership, and role-library actions treat long-lived `Person` identities as the product source of truth while keeping runtime-role rows as compatibility mirrors.

**Architecture:** Backend exposes group person member buckets and accepts `person_members` when creating group profiles. Frontend stores launcher and group selection as person-first state, calls only person membership endpoints in product flows, and prevents templates/runtime-only roles from directly joining teams or groups.

**Tech Stack:** Node.js Express backend, SQLite via existing database service, vanilla modular frontend JavaScript, existing `node:test`/static frontend tests, Docker-served local app on port `7010`.

---

## File Map

- Modify `apps/backend/src/server.js`: add group person buckets to bootstrap, accept person members on group profile creation, and remove direct template import routes from the product backend.
- Modify `apps/backend/src/services/personIdentityService.js`: expose grouped group-person buckets and reuse person membership repair helpers.
- Modify `apps/backend/src/db/database.js`: add additive migration/repair for resolvable group person membership from runtime members.
- Modify `apps/backend/tests/personIdentityService.test.js`: cover grouped group-person buckets and additive repair.
- Create `apps/backend/tests/groupProfilePersonCreateApi.test.js`: cover create-profile person member contract and absence of direct template import routes.
- Modify `apps/frontend/js/core/state.js`: rename or supplement launcher selected ids as person ids.
- Modify `apps/frontend/js/core/app-state-accessors-workspace-values.js`: expose person-id launcher accessors.
- Modify `apps/frontend/js/ui/workspace-renderers-launcher-role-picker.js`: render person cards and select person ids.
- Modify `apps/frontend/js/core/workspace-profile-create-form-action.js`: submit `person_members`, remove legacy `/teams/:id/members` product write.
- Modify `apps/frontend/js/core/selectors-managed-profile-members.js`: read `group_person_members_by_profile_id` for product membership.
- Modify `apps/frontend/js/ui/workspace-renderers-group-member-pool-core-roles.js`: list only team people with runtime bindings.
- Modify `apps/frontend/js/core/role-library-group-action-add.js`: use person-members only, no legacy fallback.
- Modify `apps/frontend/js/core/role-library-group-action-remove.js`: use person-members only, no legacy fallback.
- Delete `apps/frontend/js/ui/role-library-runtime-import-item-actions.js`: external template cards are reference-only and no longer expose direct import buttons.
- Modify `apps/frontend/js/ui/role-library-runtime-session-role-core-actions.js`: only show team/group add actions for roles with person identity.
- Modify `apps/frontend/index.html` and `apps/frontend/js/core/i18n.js`: replace stale role-pool/contact copy with person/template/runtime copy.
- Create `apps/frontend/tests/person-first-launcher.test.mjs`: static contract for launcher create path.
- Create `apps/frontend/tests/person-first-role-library.test.mjs`: static contract for role library and group actions.

## Task 1: Backend Bootstrap Group Person Buckets

**Files:**
- Modify: `apps/backend/src/services/personIdentityService.js`
- Modify: `apps/backend/src/server.js`
- Test: `apps/backend/tests/personIdentityService.test.js`

- [ ] **Step 1: Write grouped bucket test**

Add this test to `apps/backend/tests/personIdentityService.test.js` after the existing team person bucket coverage:

```js
test('lists group person members by profile id', () => {
    const { db, service } = createHarness();
    service.addGroupPersonMember('profile_alpha', 'person_ji', {
        legacy_role_id: 'ji_archivist',
        legacy_role_name: '犬娘小吉'
    });

    const buckets = service.listGroupPersonMembersByProfileId(['profile_alpha']);

    assert.equal(buckets.profile_alpha.length, 1);
    assert.equal(buckets.profile_alpha[0].person_id, 'person_ji');
    assert.equal(buckets.profile_alpha[0].legacy_role_id, 'ji_archivist');
    assert.equal(buckets.profile_alpha[0].person.display_name, '犬娘小吉');
    db.close();
});
```

- [ ] **Step 2: Run test and confirm failure**

Run:

```bash
npm test -- apps/backend/tests/personIdentityService.test.js
```

Expected: fails because `listGroupPersonMembersByProfileId` is not defined.

- [ ] **Step 3: Implement grouped bucket method**

In `apps/backend/src/services/personIdentityService.js`, add:

```js
listGroupPersonMembersByProfileId(profileIds = []) {
    const ids = [...new Set((profileIds || []).map(id => normalizeText(id)).filter(Boolean))];
    const buckets = Object.fromEntries(ids.map(id => [id, []]));
    if (!ids.length) {
        return buckets;
    }

    const placeholders = ids.map(() => '?').join(', ');
    const rows = this.db.prepare(`
        SELECT profile_id, person_id, person_name, group_alias, member_order, enabled, speaking_policy_json, legacy_role_id
        FROM group_person_members
        WHERE profile_id IN (${placeholders})
        ORDER BY profile_id ASC, member_order ASC, person_name ASC
    `).all(...ids);

    for (const row of rows) {
        const item = this.normalizeGroupPersonMemberRow(row);
        if (!buckets[item.profile_id]) {
            buckets[item.profile_id] = [];
        }
        buckets[item.profile_id].push(item);
    }
    return buckets;
}
```

If `normalizeGroupPersonMemberRow` does not exist, extract the current mapping logic from `listGroupPersonMembers(profileId)` into that helper and have both methods call it.

- [ ] **Step 4: Add bootstrap field**

In `apps/backend/src/server.js`, inside `/api/bootstrap`, compute:

```js
const profileIds = profiles.map(profile => profile.id);
const groupPersonMembersByProfileId = personIdentityService.listGroupPersonMembersByProfileId(profileIds);
```

Then include it in `bootstrapPayload`:

```js
group_person_members_by_profile_id: groupPersonMembersByProfileId,
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm test -- apps/backend/tests/personIdentityService.test.js
```

Expected: pass.

## Task 2: Backend Person-Member Group Creation

**Files:**
- Modify: `apps/backend/src/server.js`
- Test: `apps/backend/tests/groupProfilePersonCreateApi.test.js`

- [ ] **Step 1: Write backend route contract test**

Create `apps/backend/tests/groupProfilePersonCreateApi.test.js` with static checks:

```js
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const serverSource = fs.readFileSync(path.join(__dirname, '../src/server.js'), 'utf8');

function getPostRoute(route) {
    const start = serverSource.indexOf(`app.post('${route}'`);
    assert.notStrictEqual(start, -1, `${route} exists`);
    const next = serverSource.indexOf('\napp.', start + 1);
    return serverSource.slice(start, next === -1 ? serverSource.length : next);
}

const createProfileRoute = getPostRoute('/api/group-profiles');
assert.match(createProfileRoute, /person_members/, 'group profile create accepts person_members');
assert.match(createProfileRoute, /personIdentityService\.addGroupPersonMember/, 'group profile create writes group person membership');
assert.doesNotMatch(createProfileRoute, /members:\s*req\.body\?\.members\s*\|\|\s*\[\]/, 'product create route does not blindly pass runtime members');

assert.doesNotMatch(
    serverSource,
    /app\.post\('\/api\/import-sources\/:source\/import'/,
    'external templates are no longer directly imported into runtime roles'
);

console.log('groupProfilePersonCreateApi.test.js passed');
```

- [ ] **Step 2: Run test and confirm failure**

Run:

```bash
node apps/backend/tests/groupProfilePersonCreateApi.test.js
```

Expected: fails because create route does not yet accept `person_members` and the direct template import route still exists.

- [ ] **Step 3: Add person member normalization helper**

In `apps/backend/src/server.js`, near existing normalize helpers, add:

```js
function normalizePersonMemberPayloadList(source = []) {
    if (!Array.isArray(source)) {
        return [];
    }
    return source
        .map((member, index) => ({
            person_id: normalizeText(member?.person_id || member?.personId || member?.id),
            member_order: member?.member_order ?? member?.memberOrder ?? ((index + 1) * 10),
            group_alias: normalizeText(member?.group_alias || member?.groupAlias),
            speaking_policy: member?.speaking_policy || member?.speakingPolicy || null
        }))
        .filter(member => member.person_id);
}
```

- [ ] **Step 4: Update `POST /api/group-profiles`**

Replace the route's `members: req.body?.members || []` behavior with:

```js
const personMembers = normalizePersonMemberPayloadList(
    req.body?.person_members || req.body?.personMembers || req.body?.person_ids?.map(personId => ({ person_id: personId }))
);
const profile = sessionService.createProfile({
    id: req.body?.id,
    name: req.body?.name,
    team_id: req.body?.team_id,
    description: req.body?.description,
    mode: req.body?.mode,
    invite_prompt: req.body?.invite_prompt,
    mode_options: req.body?.mode_options,
    group_prompt:
        req.body?.group_prompt != null
            ? req.body.group_prompt
            : (cloneFromProfileId ? undefined : DEFAULT_PROFILE.group_prompt),
    clone_from_profile_id: cloneFromProfileId,
    members: personMembers.length ? [] : (req.body?.members || [])
});

for (const member of personMembers) {
    const person = personIdentityService.getPerson(member.person_id);
    const legacyRoleId = requireRuntimePersonLegacyRole(person);
    personIdentityService.addGroupPersonMember(profile.id, person.id, {
        group_alias: member.group_alias,
        member_order: member.member_order,
        speaking_policy: member.speaking_policy,
        legacy_role_id: legacyRoleId,
        legacy_role_name: person.display_name
    });
}

res.status(201).json({ profile: sessionService.getProfile(profile.id) });
```

- [ ] **Step 5: Remove direct template import route**

In `apps/backend/src/server.js`, remove `POST /api/import-sources/:source/import`. External templates are references for Person Studio, not user-visible runtime-role import commands.


- [ ] **Step 6: Run backend tests**

Run:

```bash
node apps/backend/tests/groupProfilePersonCreateApi.test.js
npm test -- apps/backend/tests/personMembershipApi.test.js apps/backend/tests/teamPersonPoolProductBoundary.test.js
```

Expected: pass.

## Task 3: Frontend Launcher Person Selection

**Files:**
- Modify: `apps/frontend/js/core/state.js`
- Modify: `apps/frontend/js/core/app-state-accessors-workspace-values.js`
- Modify: `apps/frontend/js/ui/workspace-renderers-launcher-role-picker.js`
- Modify: `apps/frontend/js/core/workspace-profile-create-form-action.js`
- Test: `apps/frontend/tests/person-first-launcher.test.mjs`

- [ ] **Step 1: Write frontend launcher contract test**

Create `apps/frontend/tests/person-first-launcher.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = relativePath => readFileSync(join(repoRoot, relativePath), 'utf8');

const state = read('js/core/state.js');
assert.match(state, /launcherSelectedPersonIds/, 'launcher selection state stores person ids');

const accessors = read('js/core/app-state-accessors-workspace-values.js');
assert.match(accessors, /getLauncherSelectedPersonIds/, 'workspace accessors expose selected person ids');
assert.match(accessors, /setLauncherSelectedPersonIds/, 'workspace accessors set selected person ids');

const renderer = read('js/ui/workspace-renderers-launcher-role-picker.js');
assert.match(renderer, /person_identity/, 'launcher renders person-backed cards');
assert.match(renderer, /person_identity\.id/, 'launcher toggles by person identity id');
assert.doesNotMatch(renderer, /selectedRoleIds/, 'launcher no longer uses role id selection naming');

const createAction = read('js/core/workspace-profile-create-form-action.js');
assert.match(createAction, /person_members/, 'launcher create submits person_members');
assert.match(createAction, /person_id/, 'launcher create sends person_id');
assert.doesNotMatch(createAction, /\/api\/teams\/\$\{encodeURIComponent\(managedTeam\.id\)\}\/members/, 'launcher create does not add bare runtime team members');
assert.doesNotMatch(createAction, /role_id:\s*roleId/, 'launcher create does not submit role_id members');

console.log('person-first-launcher.test.mjs passed');
```

- [ ] **Step 2: Run test and confirm failure**

Run:

```bash
node apps/frontend/tests/person-first-launcher.test.mjs
```

Expected: fails on current role-id launcher naming.

- [ ] **Step 3: Update state naming**

In `apps/frontend/js/core/state.js`, replace launcher role id state with:

```js
launcherSelectedPersonIds: new Set(),
```

Keep a temporary alias only if required by surrounding accessors, but product code should call person accessors.

- [ ] **Step 4: Update workspace accessors**

In `apps/frontend/js/core/app-state-accessors-workspace-values.js`, expose:

```js
getLauncherSelectedPersonIds: () => state.launcherSelectedPersonIds,
setLauncherSelectedPersonIds: value => {
    state.launcherSelectedPersonIds = value instanceof Set ? value : new Set(value || []);
},
clearLauncherSelectedPersonIds: () => {
    state.launcherSelectedPersonIds.clear();
},
```

Wire these names through the existing dependency key files where the old role-id names are passed.

- [ ] **Step 5: Update launcher renderer**

In `apps/frontend/js/ui/workspace-renderers-launcher-role-picker.js`, derive person id from the card:

```js
function getPersonId(role) {
    return role?.person_identity?.id || '';
}
```

Use `personId` in selection:

```js
const selectedPersonIds = getLauncherSelectedPersonIds();
const selectedRoles = roles.filter(role => selectedPersonIds.has(getPersonId(role)));
```

In card toggle, add/delete `personId`, not `role.id`.

- [ ] **Step 6: Update create action**

In `apps/frontend/js/core/workspace-profile-create-form-action.js`, replace role member preparation with:

```js
function getPersonRole(personId) {
    return (getBootstrapData()?.roles || []).find(role => role?.person_identity?.id === personId) || null;
}

async function prepareLauncherMembers() {
    if (getWorkspaceMode?.() !== 'launcher') {
        return [];
    }
    const selectedPersonIds = [...(getLauncherSelectedPersonIds?.() || [])].filter(Boolean);
    if (!selectedPersonIds.length) {
        showToast('请先从人物通讯录选择至少 1 个群聊成员', 'warning');
        return null;
    }
    return selectedPersonIds.map((personId, index) => ({
        person_id: personId,
        member_order: (index + 1) * 10,
        group_alias: getPersonRole(personId)?.person_identity?.display_name || ''
    }));
}
```

Then set:

```js
values.personMembers = launcherMembers;
values.members = [];
values.startSession = true;
```

Ensure request payload builder sends `person_members`.

- [ ] **Step 7: Run frontend test**

Run:

```bash
node apps/frontend/tests/person-first-launcher.test.mjs
```

Expected: pass.

## Task 4: Frontend Group Person Membership

**Files:**
- Modify: `apps/frontend/js/core/selectors-managed-profile-members.js`
- Modify: `apps/frontend/js/ui/workspace-renderers-group-member-pool-core-roles.js`
- Modify: `apps/frontend/js/core/role-library-group-action-add.js`
- Modify: `apps/frontend/js/core/role-library-group-action-remove.js`
- Test: `apps/frontend/tests/person-first-role-library.test.mjs`

- [ ] **Step 1: Write group action contract test**

Create `apps/frontend/tests/person-first-role-library.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = relativePath => readFileSync(join(repoRoot, relativePath), 'utf8');

const selectors = read('js/core/selectors-managed-profile-members.js');
assert.match(selectors, /group_person_members_by_profile_id/, 'managed profile membership reads group person buckets');
assert.match(selectors, /person_id/, 'managed profile selectors expose person ids');

const groupAdd = read('js/core/role-library-group-action-add.js');
assert.match(groupAdd, /person-members/, 'group add uses person membership endpoint');
assert.doesNotMatch(groupAdd, /\/group-profiles\/\$\{encodeURIComponent\(profile\.id\)\}\/members/, 'group add has no legacy runtime fallback');

const groupRemove = read('js/core/role-library-group-action-remove.js');
assert.match(groupRemove, /person-members/, 'group remove uses person membership endpoint');
assert.doesNotMatch(groupRemove, /\/group-profiles\/\$\{encodeURIComponent\(profile\.id\)\}\/members/, 'group remove has no legacy runtime fallback');

assert.equal(
    existsSync(join(repoRoot, 'js/ui/role-library-runtime-import-item-actions.js')),
    false,
    'external template cards no longer expose direct import-to-core actions'
);

const runtimeActions = read('js/ui/role-library-runtime-session-role-core-actions.js');
assert.match(runtimeActions, /person_identity/, 'runtime role actions inspect person identity before team or group add');
assert.match(runtimeActions, /不是长期人物/, 'runtime-only rows explain why they cannot join product pools');

console.log('person-first-role-library.test.mjs passed');
```

- [ ] **Step 2: Run test and confirm failure**

Run:

```bash
node apps/frontend/tests/person-first-role-library.test.mjs
```

Expected: fails on old fallback and import button copy.

- [ ] **Step 3: Update managed profile selectors**

In `apps/frontend/js/core/selectors-managed-profile-members.js`, read:

```js
const membersByProfileId = getBootstrapData()?.group_person_members_by_profile_id || {};
const members = Array.isArray(membersByProfileId?.[profile.id]) ? membersByProfileId[profile.id] : [];
```

Return both person ids and runtime role ids for display:

```js
person_id: member.person_id,
role_id: member.legacy_role_id || member.person?.legacy_role_id || '',
role_name: member.group_alias || member.person_name || member.person?.display_name || ''
```

Make `isRoleInManagedProfile(roleId)` resolve role -> person -> person membership. Add `isPersonInManagedProfile(personId)` if needed by renderers.

- [ ] **Step 4: Remove group add fallback**

In `apps/frontend/js/core/role-library-group-action-add.js`, replace the fallback block with:

```js
showToast('这不是长期人物，请先创建人物或绑定到人物后再加入群组', 'warning');
return;
```

- [ ] **Step 5: Remove group remove fallback**

In `apps/frontend/js/core/role-library-group-action-remove.js`, replace the fallback delete with:

```js
showToast('这是历史运行时成员，不是长期人物；请在兼容维护入口处理', 'warning');
return;
```

- [ ] **Step 6: Run group/role-library test**

Run:

```bash
node apps/frontend/tests/person-first-role-library.test.mjs
```

Expected: group action assertions pass; template import action assertions may still fail until Task 5.

## Task 5: Role Library Template And Runtime Boundaries

**Files:**
- Delete: `apps/frontend/js/ui/role-library-runtime-import-item-actions.js`
- Modify: `apps/frontend/js/ui/role-library-runtime-session-role-core-actions.js`
- Modify: `apps/frontend/js/ui/role-library-runtime-role-badges.js`
- Modify: `apps/frontend/index.html`
- Modify: `apps/frontend/js/core/i18n.js`
- Test: `apps/frontend/tests/person-first-role-library.test.mjs`

- [ ] **Step 1: Remove external template direct import action**

Delete `role-library-runtime-import-item-actions.js` and remove `importCatalogRole` plumbing from role-library renderers. External template cards are reference-only until a dedicated template-to-person creation flow is added.

Add a secondary disabled/help action only if the button component supports disabled state; otherwise omit it and rely on card copy.

- [ ] **Step 2: Gate runtime role actions by person identity**

In `role-library-runtime-session-role-core-actions.js`, before showing add-to-team/group actions:

```js
const personIdentity = role.person_identity || null;
if (!personIdentity) {
    actions.appendChild(createAsyncActionButton({
        label: '先创建人物',
        handler: async () => {
            showToast('这不是长期人物，请先创建人物或绑定到人物后再加入团队或群组', 'warning');
        },
        variant: 'secondary',
        showToast
    }));
    return;
}
```

Keep existing add/remove behavior for person-backed runtime roles.

- [ ] **Step 3: Update copy**

In `apps/frontend/index.html`, change:

```html
<strong>先找人物；模板用于创建人物，运行时角色用于执行。</strong>
<span>人物通讯录收纳长期人物；模板用于创建人物；群组决定本次谁上场。</span>
```

Change external source tip:

```html
<p class="role-manager-tip">这些模板来自 PromptX 和 agency-agents。模板需要先创建为长期人物，才能加入团队或群组。</p>
```

Change current roles tip:

```html
<p class="role-manager-tip">这里展示核心运行时角色。只有绑定了长期人物的角色，才能加入团队或群组。</p>
```

- [ ] **Step 4: Update i18n**

In `apps/frontend/js/core/i18n.js`, add/update translations for the exact Chinese strings introduced above and remove stale translations that describe teams as runtime role pools.

- [ ] **Step 5: Run frontend role-library test**

Run:

```bash
node apps/frontend/tests/person-first-role-library.test.mjs
```

Expected: pass.

## Task 6: Request Payload And Dependency Wiring

**Files:**
- Modify: `apps/frontend/js/core/workspace-profile-create-form-request.js`
- Modify: `apps/frontend/js/core/workspace-profile-create-form-payload.js`
- Modify: `apps/frontend/js/core/app-modular-dep-keys-main-ui.js`
- Modify: `apps/frontend/js/core/workspace-runtime-renderers-factory.js`
- Modify: `apps/frontend/js/core/app-runtime-bridge-workspace.js`
- Test: `apps/frontend/tests/person-first-launcher.test.mjs`

- [ ] **Step 1: Add `person_members` to payload builder**

In `workspace-profile-create-form-payload.js`, include:

```js
const personMembers = Array.isArray(values.personMembers) ? values.personMembers : [];
```

and in the returned payload:

```js
...(personMembers.length ? { person_members: personMembers } : {}),
```

- [ ] **Step 2: Wire person selection accessors**

Replace dependency key names for launcher role selection with person selection names:

```js
'getLauncherSelectedPersonIds',
'setLauncherSelectedPersonIds',
'clearLauncherSelectedPersonIds'
```

Update all factory/bridge call sites to pass the new names into launcher renderer and create action.

- [ ] **Step 3: Run syntax checks**

Run:

```bash
node --check apps/frontend/js/core/workspace-profile-create-form-request.js
node --check apps/frontend/js/core/workspace-profile-create-form-payload.js
node --check apps/frontend/js/ui/workspace-renderers-launcher-role-picker.js
node --check apps/frontend/js/core/workspace-profile-create-form-action.js
```

Expected: all exit `0`.

## Task 7: Data Repair And Product Flow Tests

**Files:**
- Modify: `apps/backend/src/db/database.js`
- Modify: `apps/backend/tests/personIdentityService.test.js`
- Modify: `package.json`

- [ ] **Step 1: Add additive repair test**

In `personIdentityService.test.js`, add a test that inserts a legacy runtime group member with a resolvable person and calls the existing migration/repair entrypoint. Assert that `group_person_members` contains the matching `person_id` and `legacy_role_id`.

- [ ] **Step 2: Implement additive repair**

In `apps/backend/src/db/database.js`, after existing person membership backfills, add SQL that inserts missing `group_person_members` rows by joining `group_profile_members.role_id` to `persons.legacy_role_id`.

Use `INSERT OR IGNORE`, do not delete runtime rows.

- [ ] **Step 3: Add package scripts**

In `package.json`, add frontend test scripts:

```json
"frontend:test:person-first-launcher": "node apps/frontend/tests/person-first-launcher.test.mjs",
"frontend:test:person-first-role-library": "node apps/frontend/tests/person-first-role-library.test.mjs"
```

If a grouped frontend test script exists, include these in it.

- [ ] **Step 4: Run targeted tests**

Run:

```bash
npm test -- apps/backend/tests/personIdentityService.test.js apps/backend/tests/groupProfilePersonCreateApi.test.js
npm run frontend:test:person-first-launcher
npm run frontend:test:person-first-role-library
```

Expected: pass.

## Task 8: Full Verification And Live Smoke

**Files:**
- No source edits unless verification exposes a bug.

- [ ] **Step 1: Run full test suite**

Run:

```bash
npm test
git diff --check
```

Expected: all tests pass and no whitespace errors.

- [ ] **Step 2: Restart local app container**

Run:

```bash
docker restart vcp-groupchat-app
```

Expected: container restarts successfully.

- [ ] **Step 3: Verify API contract**

Run:

```bash
curl -s http://localhost:7010/api/bootstrap | jq '{groupPersonKeys: (.group_person_members_by_profile_id | keys), teams: [.teams[] | {id, person_member_count, runtime_member_count}]}'
```

Expected: response includes `group_person_members_by_profile_id`.

- [ ] **Step 4: Browser smoke**

Use the in-app browser at `http://localhost:7010/` and verify:

- Launcher candidates show long-lived people.
- Role library external template cards do not show direct import actions.
- Runtime-only roles show "先创建人物" rather than direct add-to-team/group.
- Group member pool add/remove works for person-backed rows.

- [ ] **Step 5: Handoff**

Create an hcc handoff with changed files, tests, and remaining risks. Mark task `#127` done only after all required checks pass.
