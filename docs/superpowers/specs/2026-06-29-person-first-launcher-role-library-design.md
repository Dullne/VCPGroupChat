# Person-First Launcher And Role Library Design

## Context

VCPGroupChat is the product orchestration layer. VCPToolBox is the core cognitive/runtime layer. The product now has a long-lived `Person` concept with personality, emotional style, memory, and runtime-role binding, but several launcher and role-library paths still treat runtime roles as product members.

The current live state shows the mismatch clearly: the visible launcher candidate list renders long-lived people, while the create path still submits `role_id` members; the `dashboard` team has different person and runtime member counts; and the role library still carries old template-to-runtime assumptions.

## Problem

The product model needs one source of truth:

- A `Person` is the product-level member.
- A role template is a source for creating a person.
- A runtime role is execution infrastructure and compatibility mirror.

Today, the UI and API still let product flows write bare runtime-role membership. This causes teams, groups, and memory ownership to drift.

## Decision

Adopt a person-first product boundary for launcher, team membership, group membership, and role-library actions.

Runtime membership tables remain for compatibility and orchestration, but product UI must not write them directly. Product UI sends `person_id`; the backend resolves the person's runtime role and mirrors the runtime membership through `PersonIdentityService`.

## Domain Model

### Person

Long-lived identity. Owns product memory, personality, emotional style, relationship profile, and lifecycle. A person can be created from a template or manually in Person Studio.

### Role Template

Reusable source material, such as agency-agents or PromptX entries. A template cannot join a team or group directly. It can create a person draft or a person.

### Runtime Role

Executable core role used by orchestration and VCPToolBox. It can be bound to a person. It is not a product member by itself.

### Team

Product candidate pool of people. The team source of truth is `team_person_members`. `team_members` is a runtime compatibility mirror.

### Group Profile

Product chat-room configuration. The group source of truth is `group_person_members`. `group_profile_members` is a runtime compatibility mirror used by existing orchestration.

## Invariants

- Launcher selection state stores person ids, not role ids.
- Creating a group from launcher sends person members, not runtime members.
- Team add/remove writes person membership only.
- Group add/remove writes person membership only.
- Role-library template actions create or update person drafts/persons; they do not attach templates or runtime roles directly to groups.
- Runtime roles without a person identity can be inspected and bound, but cannot be added to a team or group from product UI.
- Legacy runtime membership APIs remain available for compatibility and migration, but no product UI path calls them.
- Backend bootstrap exposes enough person membership buckets for frontend state to avoid deriving product membership from runtime role ids.

## Backend Contract

### Bootstrap

`GET /api/bootstrap` should include:

- `team_person_members_by_team_id`
- `group_person_members_by_profile_id`
- `teams[].person_member_count`
- `teams[].runtime_member_count`
- existing `profiles[].members` for runtime compatibility

### Create Group Profile

`POST /api/group-profiles` accepts product membership:

```json
{
  "name": "产品路线讨论",
  "team_id": "team_default",
  "description": "讨论下一阶段产品形态",
  "person_members": [
    { "person_id": "person_legacy_nana_orchestrator", "member_order": 10 },
    { "person_id": "person_legacy_ke_researcher", "member_order": 20 }
  ]
}
```

The route creates the profile first, then calls `personIdentityService.addGroupPersonMember(...)` for each person member. That service writes `group_person_members`, backfills team person membership for the owning team, and mirrors `group_profile_members` for runtime orchestration.

### Group Person Membership

Existing person routes stay canonical:

- `POST /api/group-profiles/:id/person-members`
- `DELETE /api/group-profiles/:id/person-members/:personId`

### Legacy Runtime Membership

Existing runtime routes stay but are marked compatibility-only:

- `POST /api/teams/:id/members`
- `DELETE /api/teams/:id/members/:roleId`
- `POST /api/group-profiles/:id/members`
- `DELETE /api/group-profiles/:id/members/:roleId`

The frontend must not call these routes in launcher, team, or group product flows.

### Template Source

External template sources are read-only product references. Template-to-person conversion belongs in a person/Person Studio path, and direct template-to-runtime or template-to-group import routes are not part of the product flow.

## Frontend Behavior

### Launcher

The launcher is a person picker. Cards still show runtime availability, but selection stores person ids. Creating a chat calls `POST /api/group-profiles` with `person_members`.

Copy changes:

- "角色库" becomes "人物通讯录" in launcher-facing copy.
- The old internal role-pool copy is removed.
- Empty state says no long-lived people are available.

### Team Person Pool

The existing team person pool behavior is retained. It reads `team_person_members_by_team_id` and calls only person-members endpoints.

### Group Person Pool

The group member pool reads `group_person_members_by_profile_id`. It can render runtime compatibility rows for history, but add/remove buttons operate on people only.

If the selected row has no person identity, the UI shows a warning:

> 这不是长期人物，请先创建人物或绑定到人物后再加入群组。

### Role Library

Role Library becomes a mixed catalog with explicit sections:

- 人物通讯录: long-lived people and their runtime readiness.
- 模板目录: agency-agents / PromptX templates that can create people.
- 运行时角色: core/runtime roles for inspection and binding.

For this implementation pass, the existing layout can remain, but actions and copy must enforce the boundary:

- External template cards do not show direct import actions.
- Runtime role cards without `person_identity` do not show "加入当前团队" or "加入当前群组".
- Runtime role cards with `person_identity` can join by person id.
- The summary and filters can still count runtime roles/templates, but copy must not call them "联系人".

## Data Repair

On startup/migration, if a runtime membership row has a resolvable person by `legacy_role_id`, the system should ensure the matching person membership row exists. This is additive and should not delete historical runtime rows.

Rows that cannot resolve to a person remain runtime compatibility rows. They can be shown as legacy/runtime entries but should not be used as product membership.

## Error Handling

- Creating a group with no `person_members` returns `400` from the frontend validation before request.
- Adding a person without a bound runtime role returns `409`, reusing the existing runtime-role requirement.
- Direct template-to-group attach returns `409`.
- Bootstrap still works if person buckets are missing in older data; frontend falls back to empty person buckets, not runtime membership as source of truth.

## Testing

Backend tests must cover:

- Bootstrap exposes group person member buckets.
- `POST /api/group-profiles` with `person_members` writes group person membership and mirrors runtime membership.
- Direct template import routes are absent from the product backend.
- Legacy runtime routes still exist but are not used by product contract tests.

Frontend tests must cover:

- Launcher create action sends `person_members` and does not call team/group legacy `/members` routes.
- Group add/remove does not fallback to legacy `/members`.
- Role-library runtime roles without `person_identity` do not render add-to-team/group actions.
- External templates do not render direct import actions.

Browser smoke must verify:

- Launcher shows long-lived people.
- Creating a group from two selected people creates group person membership.
- Role library no longer offers direct template-to-group attach.

## Rollout

This is an additive migration. Existing sessions and profiles continue to run using runtime mirror rows. New product flows create person memberships first and let the backend mirror runtime rows.

Rollback is straightforward: keep the legacy runtime routes unchanged and revert frontend calls if needed. No destructive migration is required.
