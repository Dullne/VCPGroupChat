# Team Creation Draft Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current create-empty-team workflow with a team draft flow where users select members before creating the team.

**Architecture:** Keep the backend API unchanged for the first implementation. Add frontend draft state for selected role ids, reuse the existing role pool renderer for both persisted teams and draft teams, and update the create action to create the team first and then add selected members through the existing membership endpoints.

**Tech Stack:** Vanilla ES modules, static HTML/CSS, existing VCPGroupChat fetch helpers, Node smoke tests.

---

## File Structure

- Modify `apps/frontend/index.html`: add an explicit team draft command and adjust team workspace copy.
- Modify `apps/frontend/js/core/state.js`: add `teamDraftMode` and `teamDraftSelectedRoleIds`.
- Modify `apps/frontend/js/core/app-state-accessors-workspace-values.js`: expose draft getters/setters and clear helper.
- Modify `apps/frontend/js/core/app-modular-dep-keys-main-ui.js`: pass draft actions into UI event bindings.
- Modify `apps/frontend/js/core/app-runtime-bridge-interaction-role-library.js`: expose draft team add/remove actions.
- Modify `apps/frontend/js/core/workspace-runtime-renderers-factory.js`: pass draft state/actions into workspace renderers.
- Modify `apps/frontend/js/ui/workspace-renderers-deps-core.js`: pass draft state into team list, team summary, form status, and team member pool deps.
- Modify `apps/frontend/js/ui/workspace-renderers-team-list.js`: support a selectable draft row and a new-team button.
- Modify `apps/frontend/js/ui/workspace-renderers-team-summary.js`: keep form fields blank in draft mode and summarize selected draft members.
- Modify `apps/frontend/js/ui/workspace-renderers-team-form-status.js`: render draft status and disable update/delete in draft mode.
- Modify `apps/frontend/js/ui/workspace-renderers-team-member-card.js`: support draft add/remove button labels.
- Modify `apps/frontend/js/ui/workspace-renderers-team-member-pool.js`: render draft selected and available roles before a team exists.
- Modify `apps/frontend/js/core/workspace-team-create-action.js`: require selected draft members and add them after creating the team.
- Modify `apps/frontend/js/core/ui-event-bindings-team-session.js`: bind `新建团队` and `从默认团队复制成员` actions.
- Modify `apps/frontend/css/style-fixes.css`: add focused layout styling for the draft row/actions.
- Create `apps/frontend/tests/team-draft-flow-smoke.mjs`: static smoke check for draft state, renderer wiring, and create action behavior.

## Task 1: Add Draft State And Wiring

**Files:**
- Modify: `apps/frontend/js/core/state.js`
- Modify: `apps/frontend/js/core/app-state-accessors-workspace-values.js`
- Modify: `apps/frontend/js/core/app-modular-dep-keys-main-ui.js`
- Modify: `apps/frontend/js/core/app-runtime-bridge-interaction-role-library.js`
- Modify: `apps/frontend/js/core/workspace-runtime-renderers-factory.js`
- Modify: `apps/frontend/js/ui/workspace-renderers-deps-core.js`

- [ ] **Step 1: Add initial state**

Add these properties near the existing launcher state in `apps/frontend/js/core/state.js`:

```js
teamDraftMode: false,
teamDraftSelectedRoleIds: new Set(),
```

- [ ] **Step 2: Add workspace accessors**

In `apps/frontend/js/core/app-state-accessors-workspace-values.js`, create:

```js
const getTeamDraftMode = getStateValue('teamDraftMode');
const setTeamDraftMode = setStateValue('teamDraftMode');
const getTeamDraftSelectedRoleIds = getStateValue('teamDraftSelectedRoleIds');
const setTeamDraftSelectedRoleIds = setStateValue('teamDraftSelectedRoleIds');
const clearTeamDraftSelectedRoleIds = () => {
    state.teamDraftSelectedRoleIds = new Set();
};
```

Return all five accessors.

- [ ] **Step 3: Wire draft actions into main UI deps**

Add these keys to `apps/frontend/js/core/app-modular-dep-keys-main-ui.js`:

```js
'startTeamDraft',
'copyDefaultTeamMembersToDraft',
```

- [ ] **Step 4: Expose draft role actions**

In `apps/frontend/js/core/app-runtime-bridge-interaction-role-library.js`, expose:

```js
const addRoleToTeamDraft = roleId => runtime.roleLibraryActions.addRoleToTeamDraft(roleId);
const removeRoleFromTeamDraft = roleId => runtime.roleLibraryActions.removeRoleFromTeamDraft(roleId);
```

Return both actions.

- [ ] **Step 5: Pass draft deps to workspace renderers**

In `apps/frontend/js/core/workspace-runtime-renderers-factory.js`, destructure and pass:

```js
getTeamDraftMode,
getTeamDraftSelectedRoleIds,
addRoleToTeamDraft,
removeRoleFromTeamDraft,
copyDefaultTeamMembersToDraft
```

In `apps/frontend/js/ui/workspace-renderers-deps-core.js`, pass draft state into `teamListDeps`, `teamSummaryDeps`, and `teamFormStatusDeps`; pass draft member-pool actions through `apps/frontend/js/ui/workspace-renderers-deps-group.js` into `teamMemberPoolDeps`.

- [ ] **Step 6: Run syntax checks**

Run:

```bash
node --check apps/frontend/js/core/state.js
node --check apps/frontend/js/core/app-state-accessors-workspace-values.js
node --check apps/frontend/js/core/app-runtime-bridge-interaction-role-library.js
node --check apps/frontend/js/core/workspace-runtime-renderers-factory.js
node --check apps/frontend/js/ui/workspace-renderers-deps-core.js
```

Expected: all commands exit `0`.

## Task 2: Implement Draft Actions

**Files:**
- Modify: `apps/frontend/js/core/role-library-team-actions.js`
- Create: `apps/frontend/js/core/role-library-team-draft-actions.js`
- Modify: `apps/frontend/js/core/workspace-team-create-action.js`
- Modify: `apps/frontend/js/core/workspace-team-actions.js`

- [ ] **Step 1: Create draft role action helper**

Create `apps/frontend/js/core/role-library-team-draft-actions.js`:

```js
export function createTeamDraftRoleActions(deps) {
    const {
        getTeamDraftSelectedRoleIds,
        setTeamDraftSelectedRoleIds,
        renderAll
    } = deps;

    function setNext(ids) {
        setTeamDraftSelectedRoleIds(new Set([...ids].filter(Boolean)));
        renderAll();
    }

    function addRoleToTeamDraft(roleId) {
        const normalizedRoleId = String(roleId || '').trim();
        if (!normalizedRoleId) {
            return;
        }
        const next = new Set(getTeamDraftSelectedRoleIds());
        next.add(normalizedRoleId);
        setNext(next);
    }

    function removeRoleFromTeamDraft(roleId) {
        const normalizedRoleId = String(roleId || '').trim();
        if (!normalizedRoleId) {
            return;
        }
        const next = new Set(getTeamDraftSelectedRoleIds());
        next.delete(normalizedRoleId);
        setNext(next);
    }

    return {
        addRoleToTeamDraft,
        removeRoleFromTeamDraft
    };
}
```

- [ ] **Step 2: Include draft actions in role library actions**

In `apps/frontend/js/core/role-library-team-actions.js`, import `createTeamDraftRoleActions` and return:

```js
const teamDraftRoleActions = createTeamDraftRoleActions(deps);
return {
    addRoleToTeam,
    removeRoleFromTeam,
    ...teamDraftRoleActions
};
```

- [ ] **Step 3: Update create action for selected draft members**

In `apps/frontend/js/core/workspace-team-create-action.js`, add deps:

```js
getTeamDraftSelectedRoleIds,
clearTeamDraftSelectedRoleIds,
setTeamDraftMode,
getAvailableRoles,
getBootstrapData
```

Before `POST /api/teams`, require at least one selected role id:

```js
const selectedRoleIds = [...(getTeamDraftSelectedRoleIds?.() || [])].filter(Boolean);
if (!selectedRoleIds.length) {
    showToast('请先选择至少 1 个团队成员', 'warning');
    return;
}
```

After team creation, add members using existing endpoints:

```js
const createdTeamId = result.team?.id;
for (const roleId of selectedRoleIds) {
    const role = getAvailableRoles().find(item => item.id === roleId);
    await fetchJson(`/api/teams/${encodeURIComponent(createdTeamId)}/members`, {
        method: 'POST',
        body: {
            role_id: roleId,
            role_name: role?.name || roleId
        }
    });
}
clearTeamDraftSelectedRoleIds();
setTeamDraftMode(false);
```

Keep duplicate name behavior: switch to the existing team and do not add draft members to it automatically.

- [ ] **Step 4: Add workspace actions**

In `apps/frontend/js/core/workspace-team-actions.js`, expose `startTeamDraft` and `copyDefaultTeamMembersToDraft`.

`startTeamDraft` should set draft mode true, clear selected ids, reset the form, and render.

`copyDefaultTeamMembersToDraft` should read `bootstrapData.default_team_id`, collect enabled default-team role ids from `team_members_by_team_id`, set them into `teamDraftSelectedRoleIds`, and render.

- [ ] **Step 5: Run syntax checks**

Run:

```bash
node --check apps/frontend/js/core/role-library-team-draft-actions.js
node --check apps/frontend/js/core/role-library-team-actions.js
node --check apps/frontend/js/core/workspace-team-create-action.js
node --check apps/frontend/js/core/workspace-team-actions.js
```

Expected: all commands exit `0`.

## Task 3: Redesign Team Workspace Markup And Renderers

**Files:**
- Modify: `apps/frontend/index.html`
- Modify: `apps/frontend/js/core/dom-binding-getters-workspace.js`
- Modify: `apps/frontend/js/core/ui-event-bindings-team-session.js`
- Modify: `apps/frontend/js/ui/workspace-renderers-team-list.js`
- Modify: `apps/frontend/js/ui/workspace-renderers-team-summary.js`
- Modify: `apps/frontend/js/ui/workspace-renderers-team-form-status.js`
- Modify: `apps/frontend/js/ui/workspace-renderers-team-member-card.js`
- Modify: `apps/frontend/js/ui/workspace-renderers-team-member-pool.js`
- Modify: `apps/frontend/css/style-fixes.css`

- [ ] **Step 1: Add team draft buttons to markup**

In `apps/frontend/index.html`, add controls above `#team-search`:

```html
<div class="team-draft-actions">
  <button id="start-team-draft-btn" type="button" class="role-action-btn">新建团队</button>
  <button id="copy-default-team-members-btn" type="button" class="role-action-btn role-action-secondary">从默认团队复制成员</button>
</div>
```

Change the team section heading to `1. 团队草稿 / 已有团队` and member section heading to `2. 先选成员，再创建团队`.

- [ ] **Step 2: Add DOM bindings**

In `apps/frontend/js/core/dom-binding-getters-workspace.js`, add:

```js
startTeamDraftBtn: byId('start-team-draft-btn'),
copyDefaultTeamMembersBtn: byId('copy-default-team-members-btn'),
```

- [ ] **Step 3: Bind buttons**

In `apps/frontend/js/core/ui-event-bindings-team-session.js`, destructure `startTeamDraft` and `copyDefaultTeamMembersToDraft`, then bind click events for the two buttons.

- [ ] **Step 4: Render draft row and form summary**

Update team list/summary/status renderers so draft mode:

- Shows a selected `团队草稿` row before existing teams.
- Keeps form fields blank unless the user is editing them.
- Shows `已选 N 个成员。填写名称后创建团队。`
- Disables update/delete.
- Sets create button text to `创建团队并加入 N 人`.

- [ ] **Step 5: Render draft member pool**

Update `apps/frontend/js/ui/workspace-renderers-team-member-pool.js` so draft mode:

- Does not require `getManagedTeam()`.
- Uses `getTeamDraftSelectedRoleIds()` to split roles into selected and available sections.
- Uses `addRoleToTeamDraft` and `removeRoleFromTeamDraft`.
- Shows selected roles first under `已选成员`.

- [ ] **Step 6: Add minimal styles**

Add CSS for:

```css
.team-draft-actions
.team-draft-card
.team-draft-card.team-card-active
```

Use existing spacing, border, and button classes.

- [ ] **Step 7: Run syntax checks**

Run:

```bash
node --check apps/frontend/js/core/dom-binding-getters-workspace.js
node --check apps/frontend/js/core/ui-event-bindings-team-session.js
node --check apps/frontend/js/ui/workspace-renderers-team-list.js
node --check apps/frontend/js/ui/workspace-renderers-team-summary.js
node --check apps/frontend/js/ui/workspace-renderers-team-form-status.js
node --check apps/frontend/js/ui/workspace-renderers-team-member-card.js
node --check apps/frontend/js/ui/workspace-renderers-team-member-pool.js
```

Expected: all commands exit `0`.

## Task 4: Add Static Smoke Coverage

**Files:**
- Create: `apps/frontend/tests/team-draft-flow-smoke.mjs`

- [ ] **Step 1: Add smoke test**

Create `apps/frontend/tests/team-draft-flow-smoke.mjs` to assert:

```js
assert.match(indexHtml, /id="start-team-draft-btn"/);
assert.match(indexHtml, /id="copy-default-team-members-btn"/);
assert.match(stateSource, /teamDraftMode:\s*false/);
assert.match(stateSource, /teamDraftSelectedRoleIds:\s*new Set\(\)/);
assert.match(createActionSource, /创建团队并加入/);
assert.match(createActionSource, /getTeamDraftSelectedRoleIds/);
assert.match(memberPoolSource, /getTeamDraftSelectedRoleIds/);
assert.match(memberPoolSource, /addRoleToTeamDraft/);
assert.match(memberPoolSource, /removeRoleFromTeamDraft/);
```

- [ ] **Step 2: Run smoke test**

Run:

```bash
node apps/frontend/tests/team-draft-flow-smoke.mjs
```

Expected: `team draft flow smoke checks passed`.

## Task 5: Full Verification

**Files:** all modified files.

- [ ] **Step 1: Run frontend static checks**

Run:

```bash
npm run frontend:test:i18n
node apps/frontend/tests/team-draft-flow-smoke.mjs
node apps/frontend/tests/workspace-mode-switch-smoke.mjs
```

Expected: all commands pass.

- [ ] **Step 2: Run product tests**

Run:

```bash
npm run test
```

Expected: backend tests and frontend i18n tests pass.

- [ ] **Step 3: Run diff and secret checks**

Run:

```bash
git diff --check
git diff | rg -n 'sk-[A-Za-z0-9_-]{20,}|BEGIN (RSA|OPENSSH|EC|DSA|PRIVATE) KEY|API_KEY[[:space:]]*=[[:space:]]*[^[:space:]#]+|TOKEN[[:space:]]*=[[:space:]]*[^[:space:]#]+|SECRET[[:space:]]*=[[:space:]]*[^[:space:]#]+|PASSWORD[[:space:]]*=[[:space:]]*[^[:space:]#]+'
```

Expected: `git diff --check` exits `0`; secret scan has no matches.

- [ ] **Step 4: Commit**

Commit source and test changes after verification:

```bash
git add apps/frontend docs/superpowers/plans/2026-06-29-team-creation-draft-flow.md
git commit -m "feat: add team draft creation flow"
```
