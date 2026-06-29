# Team Creation Draft Design

Date: 2026-06-29

## Decision

Use the **Team Draft Table** flow selected in the visual companion.

The team workspace should let users create a team by drafting the team identity and selecting members first, then committing the team and its initial members in one action. A newly created team should not silently inherit the default team's six members.

## User Problem

The current team workspace asks users to create or select a team first, then use a separate column to add members. This makes new teams feel empty and procedural, and it makes the default team's existing members feel like accidental state rather than a clear source.

The desired flow is:

1. Start a new team draft.
2. Fill the team name and description.
3. Search and select roles before creation.
4. Click one final action: create the team and add selected members.

## Target Interaction

- The team workspace has two clear modes:
  - **Manage existing team**: select an existing team, update/delete it where allowed, and manage members.
  - **New team draft**: fill name/description, select members from the role pool, then create.
- The new team draft shows selected members above available members.
- The create button includes the selected count, for example `创建团队并加入 4 人`.
- The default team remains visible as an existing system team, but it does not prefill a new team.
- A dedicated shortcut may copy default-team members into the draft, but only by explicit user action.

## Data Flow

Frontend state holds a temporary draft member set before the team exists. On submit:

1. `POST /api/teams` creates the team with `name` and `description`.
2. For each selected role/person, call the existing team membership API.
3. Refresh bootstrap.
4. Select the newly created team.
5. Clear the draft.

This avoids a backend contract change for the first implementation and reuses the current team and member APIs.

## Validation Rules

- Team name is required.
- At least one member should be selected before creation.
- Duplicate team names keep the existing behavior: switch to the existing team instead of creating a duplicate.
- If some member additions fail after team creation, the UI should show a clear partial failure message and keep the created team selected for repair.

## UI Copy

- `新建团队`
- `团队草稿`
- `先选择成员，再创建团队。`
- `创建团队并加入 N 人`
- `从默认团队复制成员`
- `已选成员`
- `可加入成员`

## Acceptance Criteria

- Users can select roles before creating a team.
- Clicking create makes one new team and adds the selected members.
- New teams are not automatically seeded with the default team's six roles.
- The default team can still be managed as a system team with current protections.
- Existing team management remains available.
- Frontend smoke tests or static checks cover the draft workflow entry points.

## Scope

In scope:

- Team workspace layout and copy.
- Frontend draft member state.
- Reuse of existing membership APIs after create.
- Focused tests/smoke checks for the new workflow.

Out of scope:

- Backend batch create endpoint.
- Role/person model redesign.
- Team templates beyond an explicit default-team copy shortcut.
