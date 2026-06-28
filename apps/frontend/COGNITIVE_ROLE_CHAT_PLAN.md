# VCP LLMGroupChat Cognitive Role-Chat Product Plan

## 1. Product Definition

VCP LLMGroupChat is a cognitive AI person-chat system backed by reusable role templates.

Users should be able to pull long-lived AI people into a group chat like a social messaging product, while the system keeps the deeper agent capabilities: professional templates, persona, responsibilities, memory, model preferences, tool permissions, group prompts, speaking rules, and session history.

The product should not feel like a team-management backend or a prompt configuration table. It should feel like an AI group-chat workspace where persistent people behave like collaborators with visible cognition.

Core sentence:

```text
Create or select AI people from reusable professional templates, put them in a group, chat with a cognitive team, and let useful context become person/group memory.
```

## 2. Product Thesis

### 2.1 User Mental Model

Normal user model:

```text
I choose several AI people, create a group, and start chatting.
```

Power user model:

```text
I import professional templates, create long-lived AI people from them, organize people into team pools, configure group prompts and speaking rules, and manage memory behavior.
```

Implementation model:

```text
Template Library -> Person Library -> Team Person Pool -> AI Group -> Session -> Cognitive Memory
```

The UI must hide implementation complexity by default. Users should not need to understand team/profile/session internals before they can start a chat.

### 2.2 Product Shape

Primary shape:

```text
AI person group chat product
```

Not primary shape:

```text
Team admin system
Prompt management backend
Agent configuration console
Plain chat wrapper
```

### 2.3 Product Analogy

| Product Object | User Meaning | Social Product Analogy | System Responsibility |
| --- | --- | --- | --- |
| Role Template | Reusable profession/capability blueprint | Job description / archetype | Source, skills, responsibilities, default prompt, tool defaults |
| Person / Character | Long-lived AI collaborator | Contact | Name, personality, emotional style, relationships, memory notebooks, model preference |
| Template Library | All available templates | Template catalog | Search, import, inspect source, create people from templates |
| Person Library | All available AI people | Address book | Search, manage, add people to group/team |
| Person Studio | Create people from templates or freeform intent | Create contact + identity generator | PromptX/agency-agents/LLM-assisted person creation |
| Team | Person pool by project or direction | Contact tag, department, project members | Maintain reusable available-person scope |
| Group | AI chat room and collaboration template | WeChat group / Slack channel | Members, group prompt, speaking mode, rules |
| Session | One concrete conversation history | Chat history | Messages, context, selected group, run history |
| Cognitive Inspector | Visible participant cognition | No direct social analogy | Why people participate, what memory/model/tools are active |

Short version:

```text
Template Library = professional template catalog
Person Library = AI address book
Person Studio = person factory
Team = person pool
Group = AI group chat
Session = chat history
Cognitive Inspector = visible cognition
```

## 3. Core Product Principles

1. Users start from group chat, not team administration.
2. People are treated as collaborators, not prompt rows.
3. Role templates are reusable capability blueprints, not unique memory-bearing people.
4. Groups are cognitive collaboration fields, not member arrays.
5. Teams are advanced person pools, not the main entry.
6. Cognitive state should be visible, but not noisy by default.
7. Prompt details should be progressive disclosure.
8. The normal path should feel like social group creation; the advanced path can feel like an agent operations console.

## 4. Key User Paths

### 4.1 Primary Path: Launch AI Group Chat

```text
Open product
-> Click Launch Group Chat
-> Select people
-> Name the group
-> Optional: edit group prompt/speaking mode
-> Create and enter first session
-> Chat
```

System may auto-handle:

```text
No selected team -> use default team
Person not in team -> optionally add to default/current team
No session -> create session after group creation
```

### 4.2 Person Creation Path

```text
Open Person Studio
-> Describe the person in natural language
-> Optionally select PromptX / agency-agents / hybrid templates as references
-> Generate draft person with name, personality, responsibilities, memory names, model preference
-> Save to Person Library
-> Add to current group or team
```

### 4.3 Advanced Team Pool Path

```text
Open Team Person Pool
-> Create/select team
-> Pull people from Person Library into the team
-> Create multiple groups from team members
-> Maintain group templates and speaking rules
```

### 4.4 Cognitive Memory Path

```text
Finish useful conversation
-> Review summary or decisions
-> Confirm memory write if needed
-> Save to person/group/session memory
-> Next session can reuse that cognition
```

## 5. Frontend Information Architecture

Recommended top-level navigation:

```text
Chat / Launch Group Chat / Person Library / Person Studio / Template Library / Team Person Pool / Settings
```

Current project can map this gradually:

| Target Concept | Current UI | Action |
| --- | --- | --- |
| Chat | Main chat surface | Keep as primary workspace |
| Launch Group Chat | Sidebar + button, group profile form | Add as primary CTA and guided mode |
| Person Library | Role library modal in current implementation | Rename/copy-position as AI address book; distinguish people from imported templates |
| Person Studio | Studio modal in current implementation | Rename/copy-position as person factory; connect PromptX/agency-agents template references |
| Template Library | External source filters in current role library | Split imported templates from memory-bearing people |
| Team Person Pool | Team modal | Rename/copy-position as advanced person-pool management |
| Cognitive Inspector | Right round-role panel | Expand into member/state/memory inspector |

## 6. Frontend Design Direction

Visual thesis:

```text
A restrained cognitive dispatch room: calm surfaces, clear role presence, and visible collaboration state.
```

Content plan:

```text
Main workspace: group/session list, chat stage, cognitive inspector.
Launcher: person selection, group setup, create-and-chat action.
Person surfaces: library and studio for finding/creating long-lived people.
Template surfaces: catalog for importing professional references and creating people from them.
Advanced surfaces: team pool and group template management.
```

Interaction thesis:

```text
1. Launch group flow should feel like pulling people into a chat.
2. Person participation should be visually explicit: in group, in team, speaking, silent, mentioned.
3. Cognitive details should appear as an inspector, not as mandatory form noise.
```

## 7. Cognitive Capability Model

A cognitive person-chat system must expose six capability layers:

1. Person cognition: identity, duties, boundaries, voice, expertise.
2. Context cognition: current group, task, session, mentions, recent dialogue.
3. Memory cognition: private memory, group memory, knowledge memory, session summary.
4. Collaboration cognition: when to speak, when to stay silent, when to hand off.
5. Tool cognition: available tools, allowed actions, model/runtime constraints.
6. Reflection cognition: summarize, record decisions, propose memory updates.

Frontend-visible pieces:

```text
Person cards: person identity, source template, tags, model, memory state.
Group charter: group goal, prompt summary, speaking mode.
Round trace: who will speak and why.
Memory chips: read/write memory state.
Tool/model status: active model and tool availability.
```

## 8. Entity Boundaries

### 8.1 Template And Person

A role template is a reusable capability blueprint. A person is the persistent AI collaborator that can join teams, speak in groups, and own private long-term memory.

Required product fields:

```text
name
source
summary
tags
persona
responsibilities
boundaries
runtime model preference
private memory config
knowledge memory config
tool permissions
```

For templates, these fields describe defaults and professional capability. For people, these fields describe a unique identity and can be overridden from the source template.

### 8.2 Team

Team is an advanced person pool.

Team answers:

```text
Which people belong to this project/direction?
```

Team does not answer:

```text
Who speaks in this chat right now?
```

### 8.3 Group

Group is the AI chat room and collaboration template.

Group answers:

```text
Who is in this chat room?
What is the group goal?
What prompt/rules govern collaboration?
What speaking mode is active?
```

### 8.4 Session

Session is one concrete conversation under a group.

Session answers:

```text
What happened in this run?
What messages, decisions, summaries, and context belong here?
```

## 9. Implementation Phases

### Phase 1: Product Definition + Launch Entry

Goal:

```text
Make Launch Group Chat the product's main action while reusing current group creation logic.
```

Tasks:

1. Create this product plan document.
2. Add a primary `Launch Group Chat` CTA in the header.
3. Make the sidebar `+` open the group creation flow instead of feeling like an unlabeled icon.
4. Add a launcher view or guided copy that explains: select roles, create group, start session.
5. Reuse the existing group profile form and create-group action for the first implementation.
6. Verify the page opens, CTA works, group creation area is focused, and console has no errors.

Acceptance criteria:

```text
Header has a clear Launch Group Chat CTA.
Clicking it opens the workspace in group-launch mode.
The user can see a simple explanation of the group-chat flow.
Existing group creation form remains functional.
No JavaScript syntax errors.
No browser console errors on open/click.
```

### Phase 2: Real Launcher Wizard

Goal:

```text
Replace the copy-only launch mode with a real lightweight wizard.
```

Tasks:

1. Add selected-person state for launcher.
2. Build person search/filter list from available people.
3. Allow selecting multiple people directly from Person Library data.
4. Create group with selected people.
5. Auto-create first session.
6. Show success and enter chat.

Acceptance criteria:

```text
A user can create a group without manually visiting Team Person Pool.
Selected people become group members.
A new session starts automatically.
```

Implementation status:

```text
Implemented on 2026-06-20.
```

Current behavior:

1. `发起群聊` mode currently shows a direct role picker built from Role Library data. Target behavior should show a person picker backed by Person Library.
2. Users can search people, filter by tag/source template, select multiple people, and clear selection.
3. Creating a group from launcher mode first adds selected people to the current Team Person Pool if needed.
4. The selected people are sent as `members` in `POST /api/group-profiles`; compatibility may still include `role_id` until person membership endpoints exist.
5. The group creation path forces `startSession` in launcher mode and opens the new session after creation.
6. The launcher surface should present a 3-step path: select people, fill group info, create and enter chat.
7. Advanced team/group controls are hidden in launcher mode so the default path is no longer dominated by admin tooling.
8. After successful launcher creation, the modal closes automatically and leaves the user in the newly created chat session.

Verified path:

```text
Select 策士阿澄
-> Create Launcher验收群组-002152
-> Backend creates group profile with 策士阿澄 as member
-> Backend creates new session sess_9d50938982f64de4aa800a226e2f8615
```

Polish checkpoint:

```text
The launcher still reuses the same modal shell internally, but the user-facing surface is now a compact 3-step wizard.
Team Person Pool remains the underlying infrastructure and is only exposed in Team mode.
```

### Phase 3: Cognitive Inspector

Goal:

```text
Turn the right panel into a visible cognition panel.
```

Tasks:

1. Show current group charter summary.
2. Show members and their person duties/source templates.
3. Show round speaking prediction and reason badges.
4. Show memory/model status per person where available.
5. Keep current round-participant controls but place them inside the inspector hierarchy.

Acceptance criteria:

```text
Right panel explains who is participating and why.
User can distinguish default participation, mentions, random candidates, and skipped roles.
```

Implementation status:

```text
Phase 3 v1 implemented on 2026-06-20.
Phase 3 v2 runtime trace wiring implemented on 2026-06-20.
```

Current behavior:

1. The right panel is now labeled `Cognitive Inspector`.
2. It shows the active group name, description, member count, collaboration mode, session count, and group charter summary.
3. It currently lists default participating roles with duty summary, runtime model, and memory availability. Target behavior should list people, with source template as metadata.
4. It keeps the existing round-role controls and strategy preview inside the inspector hierarchy; target terminology should become round participant controls.
5. When the user manually points to a person outside the default group members, the inspector shows it as `本轮外援`.
6. The inspector now has a `最近一轮运行` section.
7. Before sending a message, `最近一轮运行` shows frontend prediction: expected speakers and blocked candidates.
8. After the backend returns `selection_trace`, `最近一轮运行` switches to backend measured state with round index, target count, success count, failed count, and role chips.
9. The lower strategy preview and the top runtime summary use the same backend trace after a message response, so the user can distinguish predicted selection from actual execution.

Verified path:

```text
Open Wizard关闭验收-010408
-> Inspector shows 犬娘小吉 as default participant with model and memory status
-> Expand round role picker
-> Select 蛇娘小冰
-> Inspector shows 蛇娘小冰 as 本轮外援
-> Strategy preview explains 手动点名 / 不在群组候选
```

Runtime trace verification:

```text
Open Wizard关闭验收-010408 / sess_144a0fde496047ccbc9aa0b5ebaf3bbc
-> Initial inspector shows 前端预测 / 等待后端实测
-> Send "运行轨迹验证：请用一句话回复。"
-> POST /api/group-chat/sessions/sess_144a0fde496047ccbc9aa0b5ebaf3bbc/messages returns 200
-> Response includes selection_trace with round_index=1, target_role_ids=["ji_archivist"], success_role_ids=["ji_archivist"], failed_role_ids=[]
-> Inspector switches to 后端实测 / 第 1 轮 / 目标 1 · 成功 1 · 失败 0
-> Strategy preview switches to 后端实绩
```

Evidence:

```text
LLMGroupChat/output/playwright/cognitive-inspector-runtime-trace.png
```

### Phase 4: Person Library as AI Address Book

Goal:

```text
Make Person Library feel like a usable AI address book while Template Library remains a professional template catalog.
```

Tasks:

1. Improve person cards around identity, source template, tags, and person summary.
2. Add clear actions: Add person to current group, Add person to team, Inspect cognition.
3. Make PromptX and agency-agents source filters clear.
4. Add empty/error/loading states.
5. Prevent external templates from looking like memory-bearing people until a person is created from them.

Acceptance criteria:

```text
Users can find a person and understand which template, if any, shaped them.
Primary action is adding a person to a group or team.
External templates have a separate primary action: create person from template.
```

Implementation status:

```text
Phase 4 v1 address-book polish implemented on 2026-06-20.
```

Current behavior:

1. Current Role Library starts with an `AI Address Book` console, but this is now a legacy label. The target model is Person Library for contacts plus Template Library for reusable external templates.
2. Users can search across role name, id, tag, description, preview, source, and voice style.
3. Users can filter by source: all, core roles, ephemeral roles, agency-agents, PromptX.
4. Users can filter by status: all, current group members, current team members, imported core roles, not-imported external templates.
5. The summary line shows real counts for core roles, ephemeral roles, current team, current group, external templates, and imported templates.
6. External catalog cards currently use actions such as `导入到核心` and `导入并加入当前群组`; target copy should become `导入为模板` and `从模板创建人物`.
7. Current role cards currently use actions such as `加入当前团队`, `加入当前群组`, `移出当前团队`, and `移出当前群组`; target copy should make clear these actions operate on people, not templates.
8. Empty states now explain when filters have no matching external templates or no matching available roles.

Verified path:

```text
Open Role Library
-> Summary shows 核心角色 16 · 临时角色 0 · 当前团队 4 · 当前群组 1 · 外部模板 240 · 已导入 1
-> Source filter PromptX shows 8 external templates and no current-role cards
-> Status filter 当前群组成员 shows 犬娘小吉 as the only current-role card
-> Keyword search accessibility shows Accessibility Auditor from agency-agents
-> Console remains 0 errors / 0 warnings
```

Evidence:

```text
LLMGroupChat/output/playwright/role-library-address-book.png
```

### Phase 5: Person Studio as Person Factory

Goal:

```text
Connect PromptX and agency-agents abilities into a coherent person creation flow.
```

Tasks:

1. Present generation modes: PromptX, agency-agents template, hybrid.
2. Generate draft person with identity/personality/responsibilities/memory/model fields.
3. Preview and edit draft.
4. Save to Person Library.
5. Add directly to current group or team after save.

Acceptance criteria:

```text
Users can describe a person and save a usable long-lived collaborator without hand-writing internal fields.
```

Implementation status:

```text
Phase 5 v1 role-factory polish implemented on 2026-06-20.
```

Current behavior:

1. Current Role Studio presents itself as `Role Factory`, not a raw backend form. Target copy should become `Person Factory`.
2. The factory panel should explain the corrected contract: PromptX supplies identity structure, agency-agents supplies professional references, and VCP turns the result into a long-lived group-chat person.
3. Users can switch generation engines: `promptx_nuwa`, `agency_adapt`, `hybrid`, and `vcp_default`.
4. The visible pipeline copy changes with the selected engine, so users know whether the current draft uses PromptX methodology, agency-agents templates, both, or only VCP default generation.
5. Users can search agency-agents templates from the factory surface and pin up to 6 references before generating.
6. The selected references panel shows whether references are pinned; if none are selected, it explains that the backend will auto-retrieve agency-agents templates by need.
7. Draft generation sends the selected engine and `reference_item_ids` to `POST /api/role-studio/draft`.
8. The generated draft preview should show person name, source template, description, responsibilities, memory names, generation engine, actual model, PromptX methodology usage, agency references, and context template.
9. The `创建并加入当前会话` action remains explicit; generating a draft alone does not mutate the current group. Target behavior should create a temporary person participant, not a template pretending to be a person.

Verified path:

```text
Open Role Studio
-> Default engine is hybrid
-> Factory panel shows PromptX + agency-agents -> VCP role draft pipeline
-> Switch promptx_nuwa / agency_adapt / hybrid / vcp_default
-> Pipeline copy updates for each engine
-> Search agency-agents reference keyword accessibility
-> Select Accessibility Auditor
-> Selected references panel shows Accessibility Auditor
-> Generate role draft from:
   创建一个负责无障碍审核的前端体验审查员，能给出 WCAG 风险、键盘导航问题和具体修复建议。
-> Backend returns draft "无障碍审核员"
-> Draft meta shows engine=hybrid, model=bytedance-seed/seed-1.6-flash-20250625, PromptX 方法论 10 个文件, agency 参考 Accessibility Auditor
-> Console remains 0 errors / 0 warnings
```

Evidence:

```text
LLMGroupChat/output/playwright/role-studio-factory.png
```

Implementation status:

```text
Phase 5 v2 persist-to-library flow implemented on 2026-06-20.
```

Current behavior:

1. Current Role Studio draft preview exposes four explicit next actions:
   `创建并加入当前会话`, `保存到角色库`, `保存并加入当前团队`, and `保存并加入当前群组`.
2. `创建并加入当前会话` currently creates an ephemeral session role for trial use. Target behavior should create an ephemeral person participant with an optional source template.
3. `保存到角色库` currently calls `POST /api/role-studio/save` with `target=library`, imports the draft through VCP Core, and refreshes bootstrap data. Target behavior should save a person record and create or reference a core role only as runtime compatibility.
4. `保存并加入当前团队` currently calls the same endpoint with `target=team`, imports the role into VCP Core, and attaches it to the selected Team Role Pool. Target behavior should attach the person to the Team Person Pool.
5. `保存并加入当前群组` currently calls the same endpoint with `target=group`, imports the role into VCP Core, attaches it to the selected group profile, and relies on `addProfileMember` to keep the role in the group profile's team pool as well. Target behavior should attach the person membership to the group and keep role_id only as compatibility metadata.
6. The save buttons are disabled until a meaningful draft with a role name exists.
7. Saving a draft does not require creating a temporary session role first.

Backend contract:

```text
POST /api/role-studio/save
body:
  target: library | team | group
  team_id: required when target=team
  profile_id: required when target=group
  draft: VCP-compatible role draft

response:
  role: imported core role
  target: resolved target
  team: team when applicable
  team_members: team member list when applicable
  profile: group profile when applicable
```

Verified path:

```text
Open Role Studio
-> Generate draft "工坊保存验收员"
-> Save to Role Library
-> Backend imports role as role_studio_工坊保存验收员
-> Bootstrap role count increases from 16 to 17
-> Open Role Library
-> Search 工坊保存验收员
-> Role Library shows the saved role as a core role
-> Backend target=team verification attaches the role to a temporary team
-> Backend target=group verification attaches the role to a temporary group and keeps it in the group team's role pool
-> Temporary verification team/group and core verification role were removed after checks
-> Bootstrap returns to role_count=16 with no leftover 工坊保存验收 test role/team/group
-> Console remains 0 errors / 0 warnings
```

Evidence:

```text
LLMGroupChat/output/playwright/role-studio-persist-library.png
```

### Phase 6: Memory and Reflection Loop

Goal:

```text
Make cognition persistent and inspectable.
```

Tasks:

1. Add session summary view.
2. Add memory write candidates.
3. Add user confirmation for memory writes.
4. Show memory reads in the cognitive inspector.
5. Add regression checks for memory behavior.

Acceptance criteria:

```text
Useful conversation output can become controlled memory.
Users can see what memory is being used.
```

## 10. Phase 1 Technical Plan

Files likely involved:

```text
index.html
css/frontend-polish.css
css/style-fixes.css
js/core/dom-binding-getters-workspace.js
js/core/ui-event-bindings-shell.js
js/ui/workspace-renderers-mode.js
```

Approach:

1. Add `launch-group-toggle` as primary header CTA.
2. Add a `launcher` workspace mode that still shows `team-manager-view`, because current group creation form lives there.
3. In launcher mode, copy should emphasize `Launch AI Group Chat` and focus the group creation section.
4. Wire header CTA and sidebar plus button to `openWorkspace('launcher')`.
5. Make mode rendering understand `launcher` and active CTA state.
6. Add styles that make launcher mode visibly guide the user without breaking team management.

Risk control:

```text
Do not rewrite group creation logic in Phase 1.
Do not change backend API.
Do not remove existing team/group advanced controls.
Do not reset dirty files.
```

## 11. Verification Plan

Minimum checks after Phase 1:

```bash
node --check LLMGroupChat/js/core/dom-binding-getters-workspace.js
node --check LLMGroupChat/js/core/ui-event-bindings-shell.js
node --check LLMGroupChat/js/ui/workspace-renderers-mode.js
curl -sS http://127.0.0.1:4090/ | rg "launch-group-toggle|发起群聊"
```

Browser checks:

```text
Open http://127.0.0.1:4090/
Click Launch Group Chat
Confirm modal opens with launch copy
Confirm group creation form is visible
Confirm console has no errors
```

## 12. Open Product Decisions

1. Should the public label be `发起群聊`, `发起 AI 群聊`, or `新建 AI 群组`?
   Current recommendation: `发起群聊` for top CTA, with subtitle explaining AI people and reusable professional templates.

2. Should default team membership be automatic when launching a group from arbitrary people?
   Current recommendation: yes in Phase 2, with a visible note.

3. Should person memory writes require confirmation?
   Current recommendation: yes, at least for persistent long-term private memory.

4. Should team be renamed in UI to `团队人物池`?
   Current recommendation: yes, but gradually; keep `团队` button if space is tight and use panel title/copy to clarify.
