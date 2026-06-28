import { LOCALE_STORAGE_KEY } from './constants.js';
import { loadLocaleFromStorage, saveLocaleToStorage } from './prefs.js';
import { state } from './state.js';

export const DEFAULT_LOCALE = 'zh-CN';
export const EN_LOCALE = 'en';

const TEXT_TRANSLATIONS = new Map(Object.entries({
    "AI 群聊室": "AI Group Chat Room",
    "莱恩家的小窝": "Laiye's AI Lounge",
    "当前群组": "Current Group",
    "当前会话": "Current Session",
    "未选择群组": "No group selected",
    "未选择会话": "No session selected",
    "左侧切换，右侧查看群组信息": "Switch on the left, inspect group details on the right",
    "先从左侧选择群组或发起群聊": "Select a group on the left or start a group chat",
    "团队": "Team",
    "工坊": "Studio",
    "角色库": "Role Library",
    "发起群聊": "Start Group Chat",
    "创建并开聊": "Create and Chat",
    "像微信群一样从角色库选择 AI 成员，确认群名后创建群组并立即开聊。": "Pick AI members from the role library like creating a WeChat group, confirm the group name, then start chatting immediately.",
    "团队负责按项目或方向收纳角色；群组才是真正上场聊天的 AI 房间。": "Teams collect roles by project or direction; groups are the actual AI chat rooms.",
    "先用一句话生成角色草稿，再决定是否作为当前会话临时角色加入。": "Generate a role draft from one sentence first, then decide whether to add it as a temporary role in the current session.",
    "这里浏览核心角色与外部目录模板。导入到核心后，才能稳定地加入群组并参与长期记忆。": "Browse core roles and external directory templates here. Import them into core before they can reliably join groups and participate in long-term memory.",
    "+ 发起群聊": "+ Start Group Chat",
    "群聊": "Group Chats",
    "一个群聊就是一个持续聊天入口": "One group chat is one persistent conversation entry",
    "内部会话": "Internal Sessions",
    "内部群组选择": "Internal Group Selector",
    "图片": "Image",
    "发送": "Send",
    "本轮发言女仆": "Speaking Roles This Round",
    "Cognitive Inspector": "Cognitive Inspector",
    "正在读取群组认知状态。": "Reading group cognitive state.",
    "成员": "Members",
    "模式": "Mode",
    "会话": "Sessions",
    "顺序协作": "Sequential Collaboration",
    "邀请发言": "Invite Only",
    "自然随机": "Natural Random",
    "群组章程": "Group Charter",
    "暂无群组章程。": "No group charter yet.",
    "在场角色": "Roles Present",
    "最近一轮运行": "Latest Runtime Round",
    "前端预测": "Frontend Prediction",
    "后端实测": "Backend Runtime",
    "等待首轮消息": "Waiting for the first message",
    "等待后端实测": "Waiting for backend runtime",
    "最近一轮": "Latest Round",
    "群聊状态与沉淀": "Group Chat State and Memory",
    "角色参与状态": "Participant States",
    "记忆沉淀": "Memory Deposition",
    "项目资产": "Project Assets",
    "普通群聊": "Ordinary Group Chat",
    "项目/决策会话": "Project/Decision Chat",
    "已形成共识": "Consensus reached",
    "有保留共识": "Consensus with caveats",
    "保留分歧": "Divergence preserved",
    "继续讨论": "Still discussing",
    "不要求结论": "No conclusion required",
    "已发言": "Spoke",
    "旁听": "Listening",
    "沉默": "Silent",
    "暂不参与": "Not participating",
    "未记录": "Not recorded",
    "补充上下文": "Added context",
    "风险提醒": "Risk note",
    "支持": "Supports",
    "反对": "Opposes",
    "中立": "Neutral",
    "未标注立场": "No stance",
    "需确认": "Needs confirmation",
    "自动候选": "Candidate",
    "决策": "Decision",
    "风险": "Risk",
    "问题": "Question",
    "任务": "Task",
    "待讨论": "To discuss",
    "待认领": "Unclaimed",
    "暂无预计发言": "No expected speakers",
    "暂无失败角色": "No failed roles",
    "暂无成功发言": "No successful speakers",
    "发送消息后，这里会显示后端真实选择、成功发言和失败角色。": "After sending a message, backend selection, successful speakers, and failed roles will appear here.",
    "当前没有预计发言角色。可以先选择角色、调整群组模式，或直接发送消息让后端决定。": "No roles are expected to speak. Select roles, adjust the group mode, or send a message and let the backend decide.",
    "记忆与反思": "Memory and Reflection",
    "生成反思": "Generate Reflection",
    "还没有会话反思。发送几轮消息后，可以生成候选记忆。": "No session reflection yet. After a few rounds, you can generate candidate memories.",
    "向量索引修复": "Vector Index Repair",
    "先扫描，只做 dry-run，不会消耗向量额度。": "Scan first. Dry-run only; it will not consume embedding quota.",
    "扫描待补索引": "Scan Missing Indexes",
    "补 1 条（会消耗向量额度）": "Requeue 1 (uses quota)",
    "补 5 条（会消耗向量额度）": "Requeue 5 (uses quota)",
    "本轮发言策略": "Speaking Strategy",
    "展开": "Expand",
    "收起": "Collapse",
    "清空点名": "Clear Mentions",
    "策略预览": "Strategy Preview",
    "团队角色池": "Team Role Pool",
    "角色工坊": "Role Studio",
    "关闭": "Close",
    "1. 选择或创建团队": "1. Select or Create a Team",
    "团队就是一个角色池：先建一个方向，再把相关角色拉进来。日常发起群聊仍从左侧“+ 发起群聊”开始。": "A team is a role pool: define a direction first, then pull relevant roles in. Daily group chats still start from '+ Start Group Chat' on the left.",
    "2. 从角色库拉人进团队": "2. Pull Roles into the Team",
    "搜索角色": "Search Roles",
    "标签筛选": "Filter by Tag",
    "这就是团队的主功能：按标签/关键词筛选角色，点“加入这个团队”。已加入的人会固定在上方，作为这个团队的角色池。": "This is the team's main job: filter roles by tag or keyword, then click 'Add to this team'. Joined roles stay pinned as this team's role pool.",
    "创建这个团队": "Create Team",
    "更新团队": "Update Team",
    "删除团队": "Delete Team",
    "团队成员池准备好后，左侧“+ 发起群聊”会更容易选人": "Once the team pool is ready, '+ Start Group Chat' on the left can pick members faster",
    "1 选成员": "1 Pick Members",
    "2 起群名": "2 Name Group",
    "3 进入聊天": "3 Enter Chat",
    "发起一个新的 AI 群聊": "Start a New AI Group Chat",
    "像微信拉人建群一样：从 AI 通讯录选成员，起一个群名，然后直接开始对话。": "Like creating a WeChat group: pick members from the AI address book, name the group, then start talking.",
    "选择群聊成员": "Select Group Chat Members",
    "从 AI 通讯录里拉人进群。已选成员会固定显示在上方，点击成员卡片即可加入或移出。": "Pull people into the group from the AI address book. Selected members stay pinned above; click a member card to add or remove.",
    "清空选择": "Clear Selection",
    "搜索联系人": "Search Contacts",
    "按标签看": "View by Tag",
    "确认群聊": "Confirm Group Chat",
    "给这次群聊起个名字。创建后会自动进入聊天，后续历史仍在左侧同一个群聊入口里。": "Name this group chat. After creation, you enter chat automatically, and history stays under the same group entry on the left.",
    "创建后立即开聊": "Start Chat Immediately",
    "已选 AI 成员会直接进入新群聊。底层角色池和 Prompt 编排由系统自动处理。": "Selected AI members will enter the new group chat directly. The system handles role pool and prompt orchestration underneath.",
    "群聊名称": "Group Chat Name",
    "一句话说明": "One-line Description",
    "载入当前模板": "Load Current Template",
    "复制当前模板": "Duplicate Current Template",
    "用当前模板开新会话": "Start New Session with Current Template",
    "保存当前模板": "Save Current Template",
    "删除当前模板": "Delete Current Template",
    "创建这个群组": "Create Group",
    "4. 从团队拉人入群": "4. Pull Team Members into Group",
    "群组只能从当前团队成员池里选人。团队决定可选角色，群组决定本次谁上场。": "Groups can only choose from the current team pool. The team defines candidates; the group decides who joins this chat.",
    "克隆当前群组成员与群组 Prompt": "Clone Current Group Members and Group Prompt",
    "会复制当前已选群组的成员编排和群组级提示词到新模板。": "Copies the selected group's member orchestration and group-level prompt into the new template.",
    "创建后立即切换到新会话": "Switch to the new session immediately",
    "顺序协作（默认）": "Sequential Collaboration (default)",
    "邀请发言（必须点名）": "Invite Only (must mention roles)",
    "自然随机（实验）": "Natural Random (experimental)",
    "最少发言人数": "Min Speakers",
    "最多发言人数": "Max Speakers",
    "点名策略": "Mention Strategy",
    "点名优先（仅点名发言）": "Mentions First (mentioned roles only)",
    "忽略点名，仅随机": "Ignore Mentions, Random Only",
    "一句话创建角色": "Create a Role from One Sentence",
    "普通用户不应该手填一堆角色字段。先说一句需求，系统帮你生成角色草稿，再做必要微调。": "Users should not fill a pile of role fields manually. State the need in one sentence, let the system draft the role, then make small edits if needed.",
    "角色工坊生成流水线": "Role Studio Generation Pipeline",
    "PromptX 负责角色结构，agency-agents 负责专业参考，VCP 负责变成可上场角色。": "PromptX handles role structure, agency-agents provides professional references, and VCP turns them into playable roles.",
    "工坊不会直接改仓库文件；它会生成一个 VCP 角色草稿，你确认后才加入当前会话。": "The studio does not edit repository files directly. It generates a VCP role draft and only joins the current session after you confirm.",
    "描述需求": "Describe Need",
    "一句话说明想补什么角色": "One sentence about the role you need",
    "选引擎/参考": "Choose Engine/References",
    "PromptX、agency 或混合": "PromptX, agency, or hybrid",
    "生成草稿": "Generate Draft",
    "检查职责、记忆和模板": "Check responsibilities, memory, and template",
    "加入会话": "Join Session",
    "先作为临时角色上场": "Join as a temporary role first",
    "生成目标：VCP 群聊角色草稿，不会直接创建 PromptX 文件或 agency 仓库角色。": "Generation target: VCP group chat role draft. It will not directly create PromptX files or agency repository roles.",
    "生成引擎": "Generation Engine",
    "参考模板检索": "Reference Template Search",
    "混合模式会用 PromptX 女娲做角色工程，再用 agency-agents 模板补足专业度。": "Hybrid mode uses PromptX Nuwa for role engineering and agency-agents templates for professional depth.",
    "创角模型策略": "Role Creation Model Policy",
    "角色运行模型": "Role Runtime Model",
    "默认按后端模型池自动优选，指定模型失败时仍会自动回退。": "By default, the backend model pool auto-selects. If a specified model fails, it still falls back automatically.",
    "角色运行模型决定它后续发言时调用哪一个模型，留空则走核心默认。": "The runtime model decides which model the role uses when speaking. Leave empty to follow core default.",
    "生成角色草稿": "Generate Role Draft",
    "清空": "Clear",
    "先输入一句话需求，再生成角色草稿。": "Enter a one-sentence need, then generate a role draft.",
    "草稿预览": "Draft Preview",
    "先确认角色定位、职责和记忆命名是否合理。普通用户到这一步通常就够了。": "First confirm whether role positioning, responsibilities, and memory naming make sense. Most users can stop here.",
    "还没有角色草稿。先输入一句话需求，或展开高级编辑手动创建。": "No role draft yet. Enter a one-sentence need first, or expand advanced editing to create manually.",
    "职责": "Responsibilities",
    "认知草稿": "Cognitive Draft",
    "模板摘要": "Template Summary",
    "创建并加入当前会话": "Create and Join Current Session",
    "保存到角色库": "Save to Role Library",
    "保存并加入当前团队": "Save and Add to Current Team",
    "保存并加入当前群组": "Save and Add to Current Group",
    "展开高级编辑": "Expand Advanced Editing",
    "高级编辑": "Advanced Editing",
    "只有在你需要精细控制模型、记忆本命名或底层模板时，才需要改这里。": "Only edit here when you need precise control over model, memory notebook names, or underlying templates.",
    "角色库筛选": "Role Library Filters",
    "AI Address Book": "AI Address Book",
    "先找角色，再决定导入、进团队，还是进当前群组。": "Find roles first, then decide whether to import, add to team, or add to the current group.",
    "角色库是联系人总表；团队是角色池；群组才是真正上场聊天的房间。": "The role library is the full contact book; a team is a role pool; a group is the actual chat room.",
    "全部来源": "All Sources",
    "核心角色": "Core Roles",
    "临时角色": "Temporary Roles",
    "全部状态": "All Statuses",
    "当前群组成员": "Current Group Members",
    "当前团队成员": "Current Team Members",
    "已导入核心": "Imported to Core",
    "未导入目录": "Not Imported",
    "正在读取角色通讯录。": "Reading role address book.",
    "外部角色目录": "External Role Directories",
    "刷新目录": "Refresh Directory",
    "这些模板来自 PromptX 和 agency-agents。导入动作会写入 VCP 核心认知层，是否加入当前群组由业务后端决定。": "These templates come from PromptX and agency-agents. Import writes into the VCP core cognitive layer; the business backend decides whether they join the current group.",
    "当前可用角色": "Currently Available Roles",
    "这里展示当前会话已可用的角色。核心角色可加入或移出当前群组，临时角色可长期化。": "This shows roles available in the current session. Core roles can join or leave the current group; temporary roles can be promoted.",
    "加载中...": "Loading...",
    "初始化中...": "Initializing...",
    "初始化成功": "Initialized successfully",
    "会话创建成功": "Session created",
    "创建会话中...": "Creating session...",
    "创建团队中...": "Creating team...",
    "删除中...": "Deleting...",
    "团队创建成功": "Team created",
    "团队已删除": "Team deleted",
    "团队名称不能为空": "Team name cannot be empty",
    "群组名称不能为空": "Group name cannot be empty",
    "群组级协作指令不能为空": "Group-level collaboration prompt cannot be empty",
    "角色名称不能为空": "Role name cannot be empty",
    "请先输入一句话角色需求": "Enter a one-sentence role need first",
    "请先创建会话": "Create a session first",
    "请先选择或创建会话": "Select or create a session first",
    "请先创建或选择一个会话。": "Create or select a session first.",
    "请先选择团队": "Select a team first",
    "请先选择团队。": "Select a team first.",
    "请先选择群组": "Select a group first",
    "请先从角色库选择至少 1 个群聊成员": "Select at least one group chat member from the role library first",
    "当前没有可用群聊配置": "No group chat configuration is available",
    "当前没有可用的群聊配置": "No group chat configuration is available",
    "当前没有可用团队": "No team is available",
    "当前没有可载入的群聊配置": "No group chat configuration can be loaded",
    "当前没有可复制的群聊配置": "No group chat configuration can be duplicated",
    "当前没有可删除的群聊配置": "No group chat configuration can be deleted",
    "当前没有可删除团队": "No team can be deleted",
    "当前没有可编辑团队": "No team can be edited",
    "当前没有可保存的群聊配置": "No group chat configuration can be saved",
    "暂时没有可用的群聊容器，请先到“团队”里创建一个角色池": "No group chat container is available yet. Create a role pool under Team first.",
    "默认团队不能删除": "The default team cannot be deleted",
    "默认团队暂不支持直接重命名": "The default team cannot be renamed directly yet",
    "默认群聊配置不能删除": "The default group chat configuration cannot be deleted",
    "当前点名的角色都被禁言或已标记为本轮跳过": "All mentioned roles are muted or marked to skip this round",
    "当前群组是邀请制发言，请点名角色或在消息里使用 @角色名/@tag": "This group is invite-only. Mention roles or use @role/@tag in the message.",
    "当前自然随机模式下没有可发言角色，请先恢复角色或调整群组成员": "No roles can speak in natural random mode. Restore roles or adjust group members first.",
    "已生成会话反思和候选记忆。": "Session reflection and candidate memories generated.",
    "已确认候选记忆。": "Candidate memory confirmed.",
    "已忽略候选记忆。": "Candidate memory dismissed.",
    "未找到临时角色": "Temporary role not found",
    "收起高级编辑": "Collapse advanced editor",
    "调整高级编辑": "Adjust advanced editor",
    "记忆本：无": "Notebook: None",
    "草稿来源：后端模型": "Draft source: Backend model",
    "草稿来源：本地兜底": "Draft source: Local fallback",
    "顺序轮转": "Sequential Rotation",
    "未绑定长期人物": "Unbound persons",
    "已确认": "Confirmed",
    "团队管理": "Team Management",
    "管理": "Manage",
    "未命名项目资产": "Unnamed project asset",
    "确认项目资产": "Confirm project assets",
    "空记忆条目": "Empty memory item",
    "暂无群聊状态沉淀。普通聊天保留记忆候选，项目讨论会额外沉淀决策、风险和任务。": "No group chat state synthesis yet. Casual chats keep memory candidates; project discussions also deposit decisions, risks, and tasks.",
    "选择运行时角色": "Select runtime role",
    "需要先绑定运行时角色": "A runtime role needs to be bound first",
    "绑定后会作为长期人物参与团队和群组运行。": "Once bound, it participates in teams and groups as a long-lived person.",
    "后端创角暂时不可用，已使用本地草稿兜底。建议先改一个更具体的角色名，再创建角色。": "Backend role creation is temporarily unavailable; a local draft fallback was used. Set a more specific role name, then create the role.",
    "暂无群聊。点击“发起群聊”创建第一个 AI 群聊。": "No group chats yet. Click 'Start Group Chat' to create your first AI group chat.",
    "随机抽样": "Random Sample",
    "随机补位": "Random Fill",
    "已静音": "Muted",
    "本轮跳过": "Skipped",
    "执行失败": "Execution Failed",
    "已排除": "Excluded",
    "随机未命中": "Random Miss",
    "点名优先未命中": "Mention Priority Miss",
    "点名超出随机上限": "Mention Exceeds Random Limit",
    "不在群组候选": "Not in group candidates",
    "当前前端还没拿到模型池配置，暂时无法展示模型的详细对比信息。生成和搜索仍然会走核心默认模型。": "The frontend hasn't received model pool config yet; detailed model comparison info is unavailable. Generation and search will still use the core default model.",
    "无会话": "No Sessions",
    "无匹配模板": "No Matching Templates",
    "暂无会话": "No sessions yet",
    "暂无消息，开始对话吧！": "No messages yet. Start the conversation!",
    "暂无候选记忆。点击“生成反思”后，业务层会根据最近会话生成待确认条目。": "No candidate memories yet. Click 'Generate Reflection' and the business layer will create items to confirm from recent conversation.",
    "当前群组没有默认上场角色。": "The current group has no default active roles.",
    "当前会话使用的群组配置会决定默认上场角色、协作模式和群组级 Prompt。": "The group configuration for the current session determines default active roles, collaboration mode, and group-level prompt.",
    "这个群组还没有单独配置群组级 Prompt，创建会话时会使用默认协作规则。": "This group has no dedicated group-level prompt yet; new sessions will use the default collaboration rules.",
    "还没有扫描结果。建议先点“扫描待补索引”。": "No scan results yet. Click 'Scan Missing Indexes' first.",
    "当前没有可参与角色。": "No roles can participate right now.",
    "当前会话没有可选角色。": "No selectable roles in the current session.",
    "当前没有选中的团队。": "No team is selected.",
    "当前没有选中的群聊配置。": "No group chat configuration is selected.",
    "当前没有可管理模板，表单仅可用于新建。": "No manageable template is available. The form can only create a new one.",
    "未选择团队。": "No team selected.",
    "未选择群聊配置。": "No group chat configuration selected.",
    "当前团队还没有成员，请先在上方“团队拉人”中拉入角色。": "The current team has no members yet. Add roles in 'Pull Roles into the Team' above first.",
    "核心角色为空，无法配置团队成员。": "Core roles are empty, so team members cannot be configured.",
    "当前筛选条件下没有匹配角色。": "No roles match the current filters.",
    "当前筛选条件下没有可显示的角色。": "No displayable roles match the current filters.",
    "当前筛选没有匹配团队。": "No teams match the current filters.",
    "还没选择成员。至少选 1 个 AI 成员才能发起群聊。": "No members selected yet. Select at least one AI member to start a group chat.",
    "角色库为空，暂时不能发起群聊。": "The role library is empty, so group chat cannot start yet.",
    "当前筛选条件下没有匹配的群聊配置。": "No group chat configurations match the current filters.",
    "当前会话暂无角色": "No roles in the current session yet",
    "当前没有可展示角色。": "No roles to display.",
    "当前筛选条件下没有匹配的可用角色。": "No available roles match the current filters.",
    "当前没有可用的外部角色目录": "No external role directories are available",
    "当前没有可用的外部角色目录。": "No external role directories are available.",
    "当前筛选条件下没有匹配的外部角色模板。": "No external role templates match the current filters.",
    "当前不可用，请检查核心容器是否已挂载外部目录。": "Unavailable. Check whether the core container mounted external directories.",
    "当前没有可导入角色。": "No roles can be imported.",
    "正在加载 PromptX / agency-agents 参考源...": "Loading PromptX / agency-agents reference sources...",
    "agency-agents 目录未挂载，仍可使用 VCP 默认或 PromptX 生成。": "The agency-agents directory is not mounted. VCP default or PromptX generation is still available.",
    "没有匹配的参考模板。换个关键词再试。": "No reference templates match. Try another keyword.",
    "未固定参考模板。生成时后端会按需求自动检索 agency-agents。": "No reference templates pinned. During generation, the backend will auto-search agency-agents by need.",
    "VCP 默认生成": "VCP Default Generation",
    "跟随核心默认": "Follow Core Default",
    "全部标签": "All Tags",
    "未分组": "Ungrouped",
    "点击卡片即可把成员加入或移出本次群聊。": "Click a card to add or remove members for this group chat.",
    "从本次群聊中移除": "Remove from this group chat",
    "点击移出本次群聊": "Click to remove from this group chat",
    "点击加入本次群聊": "Click to add to this group chat",
    "正在根据当前群组上下文生成角色草稿...": "Generating a role draft from the current group context...",
    "还没有明确职责。建议补一句更具体的角色需求。": "No clear responsibilities yet. Add a more specific role need.",
    "暂无角色说明": "No role description yet",
    "暂无角色描述": "No role description yet",
    "暂无描述": "No description yet",
    "暂无团队说明": "No team description yet",
    "这个团队还没有说明。先把角色拉进团队，日常发起群聊时就能快速筛选候选成员。": "This team has no description yet. Add roles first so future group chat launches can quickly filter candidates.",
    "暂无群组说明": "No group description yet",
    "暂无认知草稿": "No cognitive draft yet",
    "暂无模板摘要": "No template summary yet",
    "未命名角色": "Untitled Role",
    "未命名会话": "Untitled Session",
    "未命名群聊": "Untitled Group Chat",
    "来源": "Source",
    "标签": "Tags",
    "模型": "Model",
    "默认模型": "Default Model",
    "运行时回退": "Runtime Fallback",
    "默认参与": "Default Participant",
    "本轮点名": "Mentioned This Round",
    "本轮外援": "Extra This Round",
    "记忆已配置": "Memory Configured",
    "已在团队": "In Team",
    "未进团队": "Not in Team",
    "已在群组": "In Group",
    "未入群": "Not in Group",
    "原生": "Native",
    "原生模板": "Native Template",
    "可编辑": "Editable",
    "已选": "Selected",
    "可选": "Available",
    "核心": "Core",
    "自定义": "Custom",
    "团队成员": "Team Member",
    "群组成员": "Group Member",
    "已长期化": "Promoted",
    "仅点名": "Mention Only",
    "后端实绩": "Backend Result",
    "手动点名": "Manual Mention",
    "@点名": "@Mention",
    "点名优先": "Mentions First",
    "点名+随机补位": "Mentions + Random Fill",
    "忽略点名": "Ignore Mentions",
    "已在这个团队": "Already in this team",
    "可加入的角色": "Roles you can add",
    "这些角色已经是团队成员，可以继续从下方补人，或移出团队。": "These roles are already team members. Add more from below or remove them from the team.",
    "点击“加入这个团队”，把角色放进当前团队成员池。": "Click 'Add to this team' to place the role into the current team pool.",
    "未挂载": "Not Mounted",
    "加入群聊": "Add to Group Chat",
    "已选，点击移出": "Selected, click to remove",
    "加入这个团队": "Add to this team",
    "移出团队": "Remove from team",
    "加入当前群组": "Add to current group",
    "移出当前群组": "Remove from current group",
    "导入": "Import",
    "已导入": "Imported",
    "长期化": "Promote",
    "删除": "Delete",
    "保存失败": "Save failed",
    "操作失败": "Operation failed",
    "输入你的消息...": "Type your message...",
    "开始新的聊天": "Start a new chat",
    "添加图片": "Add image",
    "图片预览": "Image preview",
    "移除图片": "Remove image",
    "发送消息": "Send message",
    "切换夜间模式": "Toggle night mode",
    "像微信群一样选择 AI 角色并开聊": "Pick AI roles and start chatting like WeChat",
    "选择群聊配置": "Select group chat configuration",
    "选择聊天记录": "Select chat history",
    "内部聊天记录选择": "Internal chat history selector",
    "发起群聊步骤": "Group chat launch steps",
    "当前群聊认知状态": "Current group chat cognitive state",
    "搜索团队名称 / 描述": "Search team name / description",
    "新团队名称": "New team name",
    "团队职责说明": "Team responsibility description",
    "按角色名 / 标签 / 描述筛选": "Filter by role name / tag / description",
    "按名称 / 标签 / 描述搜索 AI 成员": "Search AI members by name / tag / description",
    "搜索群聊配置 / 描述 / 成员": "Search group chat configuration / description / members",
    "例如：产品共创小组": "Example: Product co-creation group",
    "这个群聊主要用来做什么？": "What is this group chat mainly for?",
    "邀请发言时附加提示（可选）": "Extra prompt for invite-only speaking (optional)",
    "群组级协作指令，留空则继承当前群组或默认模板": "Group-level collaboration instruction; leave empty to inherit current group or default template",
    "例如：帮我创建一个既懂产品又懂代码、负责拆解需求和推进交付的角色。": "Example: Create a role that understands product and code, breaks down requirements, and drives delivery.",
    "例如：产品经理、prompt engineer、security": "Example: product manager, prompt engineer, security",
    "模型名，留空则走默认": "Model name; leave empty to use default",
    "角色名称": "Role name",
    "私有记忆本名称": "Private memory notebook name",
    "知识记忆本名称": "Knowledge memory notebook name",
    "角色简介": "Role brief",
    "角色定位 / 认知描述": "Role positioning / cognitive description",
    "职责范围，每行一条": "Responsibilities, one per line",
    "补充模板或系统提示核心内容": "Supplemental template or core system prompt content",
    "搜索角色名 / 标签 / 描述 / 来源": "Search role name / tag / description / source",
    "按来源筛选角色": "Filter roles by source",
    "按状态筛选角色": "Filter roles by status",
    "请输入新群组名称": "Enter a new group name",
    "切换语言": "Switch language",
    "切换到英文": "Switch to English",
    "切换到中文": "Switch to Chinese",
    "邀请制": "Invite Only",
    "未设置": "Not set",
    "未归属": "Unassigned",
    "当前没有启用成员": "No enabled members",
    "邀请提示已配置": "Invite prompt configured",
    "当前会话正在使用这套群聊配置": "This session is using this group configuration",
    "模板状态：默认模板，受保护": "Template status: default template, protected",
    "先创建或选择团队。": "Create or select a team first.",
    "已写入核心记忆": "Written to core memory",
    "核心写入失败": "Core write failed",
    "已确认，等待核心写入适配器": "Confirmed, awaiting core write adapter",
    "待确认": "Pending",
    "向量索引：已可检索": "Vector index: searchable",
    "向量索引：已加入核心队列": "Vector index: queued to core",
    "向量索引：等待向量生成": "Vector index: awaiting vector generation",
    "向量索引：部分可检索": "Vector index: partially searchable",
    "向量索引：未入库": "Vector index: not indexed",
    "向量索引：核心数据库暂不可用": "Vector index: core database unavailable",
    "无私有记忆": "No private memory",
    "无知识记忆": "No knowledge memory",
    "无专属记忆": "No dedicated memory",
    "空候选记忆": "Empty candidate memory",
    "角色私有": "Role private",
    "群组共享": "Group shared",
    "扫描中...": "Scanning...",
    "未入库": "Not indexed",
    "等待向量": "Awaiting vectors",
    "部分向量": "Partial vectors",
    "文件已变化": "File changed",
    "已在队列": "Queued",
    "已可检索": "Searchable",
    "未知状态": "Unknown status",
    "未知角色": "Unknown role",
    "未知记忆文件": "Unknown memory file",
    "默认记忆本": "Default notebook",
    "核心层": "Core layer",
    "未知大小": "Unknown size",
    "未知时间": "Unknown time",
    "未知错误": "Unknown error",
    "确认写入": "Confirm Write",
    "忽略": "Dismiss",
    "先扫描，只做 dry-run，不会消耗向量额度；补索引按钮才会提交核心队列。": "Scan first (dry-run only, no vector quota consumed); the requeue buttons submit to the core queue.",
    "没有发现需要补向量索引的记忆文件。": "No memory files found that need vector index repair.",
    "正在请求业务后端代理核心扫描，不会暴露核心密钥。": "Requesting the business backend to proxy the core scan; core keys are not exposed.",
    "核心索引扫描暂不可用。请确认 VCPToolBox 与 GroupChatBackend 都已启动。": "Core index scan is unavailable. Make sure both VCPToolBox and GroupChatBackend are running.",
    "等待角色回合返回核心记忆协议。发送消息后，这里会显示核心层实际开放的记忆读写范围。": "Waiting for a role turn to return the core memory protocol. After you send a message, the actual core read/write scope will appear here.",
    "当前是默认团队：承载系统默认角色池，暂不支持删除与重命名。": "This is the default team: it holds the system default role pool and cannot be deleted or renamed.",
    "系统默认角色池，保留历史群聊入口与核心角色。": "System default role pool, preserving historical group chat entries and core roles."
}));

const ATTRIBUTE_NAMES = ['title', 'placeholder', 'aria-label', 'alt'];

const PATTERN_TRANSLATIONS = [
    [/^(\d+)分钟前$/, match => `${match[1]} min ago`],
    [/^(\d+)小时前$/, match => `${match[1]} hr ago`],
    [/^(\d+)天前$/, match => `${match[1]} days ago`],
    [/^第 (\d+) 轮$/, match => `Round ${match[1]}`],
    [/^第 (\d+) 轮 · (.+) · (.+)$/, match => `Round ${match[1]} · ${translateTrimmedText(match[2], EN_LOCALE)} · ${translateTrimmedText(match[3], EN_LOCALE)}`],
    [/^第 (\d+) 位$/, match => `Position ${match[1]}`],
    [/^(\d+) 段历史$/, match => `${match[1]} history entries`],
    [/^(\d+) 个角色$/, match => `${match[1]} ${Number(match[1]) === 1 ? 'role' : 'roles'}`],
    [/^(\d+) 个历史群聊配置$/, match => `${match[1]} historical group configs`],
    [/^(\d+) 名成员$/, match => `${match[1]} members`],
    [/^(\d+) 个成员$/, match => `${match[1]} members`],
    [/^(.+) · (\d+) 名成员$/, match => `${match[1]} · ${match[2]} members`],
    [/^(\d+)\/(\d+) 个角色$/, match => `${match[1]}/${match[2]} roles`],
    [/^(\d+) 个角色 · (\d+) 个历史群聊配置$/, match => `${match[1]} roles · ${match[2]} historical group configs`],
    [/^(.+) · (\d+) 个角色 · (\d+) 个历史群聊配置$/, match => `${match[1]} · ${match[2]} roles · ${match[3]} historical group configs`],
    [/^(.+) · (\d+) 个角色$/, match => `${translateTrimmedText(match[1], EN_LOCALE)} · ${match[2]} ${Number(match[2]) === 1 ? 'role' : 'roles'}`],
    [/^(.+) · (\d+) 个历史群聊配置$/, match => `${match[1]} · ${match[2]} historical group configs`],
    // match[1] is translated so section labels (已在这个团队 / 可加入的角色 / 未分组) localize,
    // while data names (teams, tags) pass through translateTrimmedText unchanged.
    [/^(.+) · (\d+)$/, match => `${translateTrimmedText(match[1], EN_LOCALE)} · ${match[2]}`],
    [/^来源 (\d+) 条消息$/, match => `${match[1]} source ${Number(match[1]) === 1 ? 'message' : 'messages'}`],
    [/^(\d+) 位角色状态$/, match => `${match[1]} participant ${Number(match[1]) === 1 ? 'state' : 'states'}`],
    [/^(\d+) 条记忆沉淀$/, match => `${match[1]} memory ${Number(match[1]) === 1 ? 'item' : 'items'}`],
    [/^引用 (\d+) 条$/, match => `referenced ${match[1]} ${Number(match[1]) === 1 ? 'message' : 'messages'}`],
    [/^(.+) · (.+) · 引用 (\d+) 条$/, match => `${translateTrimmedText(match[1], EN_LOCALE)} · ${translateTrimmedText(match[2], EN_LOCALE)} · referenced ${match[3]} ${Number(match[3]) === 1 ? 'message' : 'messages'}`],
    [/^还有 (\d+) 位角色状态未展开。$/, match => `${match[1]} participant ${Number(match[1]) === 1 ? 'state is' : 'states are'} still hidden.`],
    [/^还有 (\d+) 条记忆沉淀未展开。$/, match => `${match[1]} memory ${Number(match[1]) === 1 ? 'item is' : 'items are'} still hidden.`],
    [/^(.+) 还有 (\d+) 条未展开。$/, match => `${translateTrimmedText(match[1], EN_LOCALE)} has ${match[2]} hidden ${Number(match[2]) === 1 ? 'item' : 'items'}.`],
    [/^来源 (.+)$/, match => `Source ${match[1]}`],
    [/^标签 (.+)$/, match => `Tags ${match[1]}`],
    [/^模型 (.+)$/, match => `Model ${match[1]}`],
    [/^模型已禁用 (.+)$/, match => `Model disabled ${match[1]}`],
    [/^运行模型：核心默认$/, () => 'Runtime model: core default'],
    [/^运行模型：(.+)（已禁用，运行时自动回退）$/, match => `Runtime model: ${match[1]} (disabled; runtime will auto-fallback)`],
    [/^运行模型：(.+)$/, match => `Runtime model: ${match[1]}`],
    [/^读: (.+) · 写: (.+)$/, match => `Read: ${match[1]} · Write: ${match[2]}`],
    [/^还有 (\d+) 条记忆协议痕迹未展开。$/, match => `${match[1]} memory protocol traces are still hidden.`],
    [/^还有 (\d+) 个候选未展开。$/, match => `${match[1]} candidates are still hidden.`],
    [/^更新 (.+)$/, match => `Updated ${match[1]}`],
    [/^理由：(.+)$/, match => `Reason: ${match[1]}`],
    [/^当前团队：(.+)。已加入 (\d+) 个角色，可选 (\d+) 个；当前标签：(.+)。$/, match => `Current team: ${match[1]}. ${match[2]} roles joined, ${match[3]} available; current tag: ${match[4]}.`],
    [/^当前团队：(.+)。已加入 (\d+) 个角色，可按标签或关键词筛选后加入。$/, match => `Current team: ${match[1]}. ${match[2]} roles joined. Filter by tag or keyword to add more.`],
    [/^当前团队：(.+)。请先选择或创建群聊配置。$/, match => `Current team: ${match[1]}. Select or create a group chat configuration first.`],
    [/^当前团队：(.+) · 当前群组：(.+)。从团队成员池中拉人入群或移出。$/, match => `Current team: ${match[1]} · current group: ${match[2]}. Pull roles from the team pool into the group or remove them.`],
    [/^当前团队：(.+)。命中 (\d+) 个角色（共 (\d+) 个）。$/, match => `Current team: ${match[1]}. ${match[2]} roles matched (${match[3]} total).`],
    [/^当前团队：([^。]+)。$/, match => `Current team: ${match[1]}.`],
    [/^按“(.+)”筛选，命中 (\d+) 个角色（共 (\d+) 个）。$/, match => `Filtered by "${match[1]}", ${match[2]} roles matched (${match[3]} total).`],
    [/^已选择 (\d+) 个成员。选好后在右侧填写群名，系统会自动处理底层角色池。$/, match => `${match[1]} members selected. Fill in the group name on the right; the system will handle the underlying role pool.`],
    [/^已选择 (\d+) 个成员。选好后在右侧填写群名，系统会自动准备群聊容器。$/, match => `${match[1]} members selected. Fill in the group name on the right; the system will prepare the group chat container.`],
    [/^已选择 (\d+) 个参考模板。生成时会作为 agency-agents 样本传给后端。$/, match => `${match[1]} reference templates selected. They will be sent to the backend as agency-agents samples during generation.`],
    [/^当前没有可参考的运行模型候选，留空时将走核心默认模型。$/, () => 'No runtime model candidates are available. Leave blank to use the core default model.'],
    [/^当前可快速切换 (\d+) 个运行模型。留空表示不在角色上绑定模型。$/, match => `${match[1]} runtime models are available for quick switching. Leave blank to avoid binding a model to the role.`],
    [/^当前未点名时，会按顺序轮转让候选角色参与，每轮最多 (\d+) 位。当前候选池包含：(.+)。$/, match => `When no role is mentioned, candidates rotate sequentially, up to ${match[1]} per round. Current candidate pool: ${match[2]}.`],
    [/^当前群组为邀请制：已识别消息点名 (.+)，发送后仅这些角色发言。$/, match => `Invite-only group: detected mentions for ${match[1]}; only these roles will speak after sending.`],
    [/^当前群组为邀请制发言：请勾选点名，或在消息里使用 @角色名\/@tag。$/, () => 'This group is invite-only: select mentions or use @role/@tag in the message.'],
    [/^自然随机模式检测到点名：(.+)，本轮按“(.+)”策略执行。$/, match => `Natural random mode detected mentions: ${match[1]}. This round uses "${translateTrimmedText(match[2], EN_LOCALE)}".`],
    [/^自然随机模式检测到点名：(.+)，本轮将优先这些角色发言。$/, match => `Natural random mode detected mentions: ${match[1]}. These roles will speak first this round.`],
    [/^自然随机模式下当前没有可用角色。$/, () => 'No roles are currently available in natural random mode.'],
    [/^当前为自然随机模式：从 (\d+) 位可用角色中随机 (\d+)-(\d+) 位发言（(.+)）。$/, match => `Natural random mode: randomly choose ${match[2]}-${match[3]} speakers from ${match[1]} available roles (${translateTrimmedText(match[4], EN_LOCALE)}).`],
    [/^模式：(.+) · 每轮 (\d+) · 候选 (\d+) · 预计发言 (\d+) · 前端预测$/, match => `Mode: ${translateTrimmedText(match[1], EN_LOCALE)} · per round ${match[2]} · candidates ${match[3]} · expected speakers ${match[4]} · Frontend Prediction`],
    [/^模式：(.+) · 每轮 (\d+) · 候选 (\d+) · 预计发言 (\d+) · 受限 (\d+) · 前端预测$/, match => `Mode: ${translateTrimmedText(match[1], EN_LOCALE)} · per round ${match[2]} · candidates ${match[3]} · expected speakers ${match[4]} · limited ${match[5]} · Frontend Prediction`],
    [/^模式：(.+) · 随机 (\d+)-(\d+) · (.+) · 候选 (\d+) · 预计发言 (\d+) · 前端预测$/, match => `Mode: ${translateTrimmedText(match[1], EN_LOCALE)} · random ${match[2]}-${match[3]} · ${translateTrimmedText(match[4], EN_LOCALE)} · candidates ${match[5]} · expected speakers ${match[6]} · Frontend Prediction`],
    [/^模式：(.+) · 随机 (\d+)-(\d+) · (.+) · 候选 (\d+) · 预计发言 (\d+) · 受限 (\d+) · 前端预测$/, match => `Mode: ${translateTrimmedText(match[1], EN_LOCALE)} · random ${match[2]}-${match[3]} · ${translateTrimmedText(match[4], EN_LOCALE)} · candidates ${match[5]} · expected speakers ${match[6]} · limited ${match[7]} · Frontend Prediction`],
    [/^模式：(.+) · 点名 (\d+) · 实际发言 (\d+) · 后端实绩$/, match => `Mode: ${translateTrimmedText(match[1], EN_LOCALE)} · mentioned ${match[2]} · actual speakers ${match[3]} · Backend Result`],
    [/^模式：(.+) · 随机 (\d+)-(\d+) · (.+) · 点名 (\d+) · 实际发言 (\d+) · 后端实绩$/, match => `Mode: ${translateTrimmedText(match[1], EN_LOCALE)} · random ${match[2]}-${match[3]} · ${translateTrimmedText(match[4], EN_LOCALE)} · mentioned ${match[5]} · actual speakers ${match[6]} · Backend Result`],
    [/^模式：(.+) · 随机 (\d+)-(\d+) · (.+) · 抽样目标 (\d+) 人 · 点名 (\d+) · 实际发言 (\d+) · 后端实绩$/, match => `Mode: ${translateTrimmedText(match[1], EN_LOCALE)} · random ${match[2]}-${match[3]} · ${translateTrimmedText(match[4], EN_LOCALE)} · sample target ${match[5]} · mentioned ${match[6]} · actual speakers ${match[7]} · Backend Result`],
    [/^预计 (\d+) 个角色会发言，(\d+) 个候选暂不参与。发送消息后会替换成后端真实运行轨迹。$/, match => `${match[1]} ${Number(match[1]) === 1 ? 'role is' : 'roles are'} expected to speak; ${match[2]} candidate${Number(match[2]) === 1 ? '' : 's'} will stay out. After sending, backend runtime trace will replace this preview.`],
    [/^目标 (\d+) · 成功 (\d+) · 失败 (\d+)(?: · (.+))?$/, match => `Targets ${match[1]} · Success ${match[2]} · Failed ${match[3]}${match[4] ? ` · ${match[4]}` : ''}`],
    [/^每轮最多 (\d+) 位$/, match => `Up to ${match[1]} per round`],
    [/^随机 (\d+)-(\d+)$/, match => `Random ${match[1]}-${match[2]}`],
    [/^抽样目标 (\d+) 人$/, match => `Sample target ${match[1]}`],
    [/^点名 (\d+)$/, match => `Mentions ${match[1]}`],
    [/^实际发言 (\d+)$/, match => `Actual speakers ${match[1]}`],
    [/^核心角色 (\d+)$/, match => `Core Roles ${match[1]}`],
    [/^临时角色 (\d+)$/, match => `Temporary Roles ${match[1]}`],
    [/^当前团队 (\d+)$/, match => `Current Team ${match[1]}`],
    [/^当前群组 (\d+)$/, match => `Current Group ${match[1]}`],
    [/^外部模板 (\d+)$/, match => `External Templates ${match[1]}`],
    [/^已导入 (\d+)$/, match => `Imported ${match[1]}`],
    [/^类型 (.+)$/, match => `Type ${translateTrimmedText(match[1], EN_LOCALE)}`],
    [/^正在保存到(.+)\.\.\.$/, match => `Saving to ${match[1]}...`],
    [/^已保存「(.+)」到(.+)。$/, match => `Saved "${match[1]}" to ${match[2]}.`],
    [/^已创建临时角色「(.+)」。如需长期保留，可在角色库中执行长期化。$/, match => `Temporary role "${match[1]}" created. Promote it in the role library if it should be kept long-term.`],
    [/^表单已载入「(.+)」，可以直接保存当前模板。$/, match => `Form loaded "${match[1]}" and can save the current template directly.`],
    [/^表单当前载入的是「(.+)」，不是正在管理的「(.+)」。如需编辑当前模板，请先点击“载入当前模板”。$/, match => `The form currently loaded "${match[1]}", not the managed "${match[2]}". To edit the current template, click "Load Current Template" first.`],
    [/^表单当前处于新建模式。若要编辑「(.+)」，请先点击“载入当前模板”。$/, match => `The form is in create mode. To edit "${match[1]}", click "Load Current Template" first.`],
    [/^模板状态：(\d+) 个会话引用(?:，最近更新 (.+))?$/, match => `Template status: ${match[1]} session references${match[2] ? `, recently updated ${match[2]}` : ''}`],
    // Group profile summary detail lines (workspace-renderers-profile-summary-details.js).
    // Names/descriptions are user data and stay as-is; structural prefixes and the
    // mode/mention enums are translated (each ` · ` segment routed through translateTrimmedText).
    [/^所属团队：(.+)$/, match => `Team: ${translateTrimmedText(match[1], EN_LOCALE)}`],
    [/^成员：(.+)$/, match => `Members: ${match[1]}`],
    [/^群组提示：(.+)$/, match => `Group prompt: ${translateTrimmedText(match[1], EN_LOCALE)}`],
    [/^群聊模式：(.+)$/, match => `Group chat mode: ${match[1].split(' · ').map(part => translateTrimmedText(part, EN_LOCALE)).join(' · ')}`],
    [/^(\d+)-(\d+)人$/, match => `${match[1]}-${match[2]} people`],
    [/^当前会话使用：(.+)，这里管理的是：(.+)$/, match => `Current session uses: ${match[1]}; managing: ${match[2]}`],
    // Team management view (workspace-renderers-team-form-status.js / team-member-pool.js).
    [/^当前管理团队：(.+)。你可以更新描述；如仍有关联群聊配置，系统会阻止删除。$/, match => `Current team: ${match[1]}. You can update the description; deletion is blocked while it still has linked group chat configurations.`],
    // Round synthesis / project assets panel.
    [/^目标 (\d+)$/, match => `Target ${match[1]}`],
    [/^成功 (\d+)$/, match => `Success ${match[1]}`],
    [/^失败 (\d+)$/, match => `Failed ${match[1]}`],
    [/^确认人 (.+)$/, match => `Confirmed by ${match[1]}`],
    [/^项目资产已确认，可在宿主机创建 (\d+) 个 hcc 任务。$/, match => `Project assets confirmed; you can create ${match[1]} hcc tasks on the host.`],
    [/^推荐任务 (\d+) 个，确认后才会开放 hcc backlog 命令。$/, match => `${match[1]} recommended tasks; the hcc backlog command unlocks after confirmation.`],
    // Role studio sources.
    [/^(.+)（不可用）$/, match => `${match[1]} (unavailable)`],
    [/^显示 (\d+) \/ (\d+) 个 agency-agents 模板。可不选，后端会按需求自动检索。$/, match => `Showing ${match[1]} / ${match[2]} agency-agents templates. Optional — the backend auto-searches as needed.`],
    // Group profile search meta (team prefix + count).
    [/^团队「(.+)」下共 (\d+) 套群聊配置（全局 (\d+)）。$/, match => `Team "${match[1]}": ${match[2]} group chat configurations here (${match[3]} globally).`],
    [/^当前团队下共 (\d+) 套群聊配置（全局 (\d+)）。$/, match => `Current team: ${match[1]} group chat configurations here (${match[2]} globally).`],
    // Role draft fallback with name.
    [/^后端创角暂时不可用，已使用本地草稿兜底：(.+)。检查后可继续创建。$/, match => `Backend role creation is temporarily unavailable; used a local draft fallback: ${match[1]}. Review, then continue creating.`],
    // Cognitive inspector: memory traces, core-write, vector index, index repair.
    // Anchored composites; names/notebooks/paths in match[1] stay as data.
    [/^核心写入：(.+) 已完成$/, match => `Core write: ${match[1]} completed`],
    [/^核心写入：(.+)$/, match => `Core write: ${match[1]}`],
    [/^核心写入失败：(.+)$/, match => `Core write failed: ${match[1]}`],
    [/^核心写入状态：(.+)$/, match => `Core write status: ${translateTrimmedText(match[1], EN_LOCALE)}`],
    [/^向量索引状态获取失败：(.+)$/, match => `Vector index status fetch failed: ${match[1]}`],
    [/^私有 (.+)$/, match => `Private ${match[1]}`],
    [/^知识 (.+)$/, match => `Knowledge ${match[1]}`],
    [/^共享 (.+)$/, match => `Shared ${match[1]}`],
    [/^向量 (\d+)\/(\d+)$/, match => `Vectors ${match[1]}/${match[2]}`],
    [/^(.+) · 更新 (.+)$/, match => `${translateTrimmedText(match[1], EN_LOCALE)} · updated ${translateTrimmedText(match[2], EN_LOCALE)}`],
    [/^索引修复检查失败：(.+)$/, match => `Index repair check failed: ${match[1]}`],
    [/^已扫描 (\d+) 个记忆文件 · 命中 (\d+) 个待补索引(?: · 上次提交 (\d+) 个入队)?$/, match => `Scanned ${match[1]} memory files · ${match[2]} pending indexes${match[3] ? ` · last submitted ${match[3]} queued` : ''}`],
    // Role Studio: draft meta badges, memory preview, model options, sources.
    [/^私有记忆：(.+)$/, match => `Private memory: ${match[1]}`],
    [/^知识记忆：(.+)$/, match => `Knowledge memory: ${match[1]}`],
    [/^角色固定模型：(.+)$/, match => `Role fixed model: ${match[1]}`],
    [/^草稿来源：(.+)$/, match => `Draft source: ${translateTrimmedText(match[1], EN_LOCALE)}`],
    [/^优先模型：(.+)$/, match => `Preferred model: ${match[1]}`],
    [/^生成模型：(.+)$/, match => `Generation model: ${match[1]}`],
    [/^生成引擎：(.+)$/, match => `Generation engine: ${match[1]}`],
    [/^PromptX 方法论：(.+) 个文件$/, match => `PromptX methodology: ${match[1]} files`],
    [/^agency 参考：(.+)$/, match => `Agency reference: ${match[1]}`],
    [/^上下文模板：(.+)$/, match => `Context template: ${match[1]}`],
    [/^agency-agents 共 (\d+) 个模板。$/, match => `${match[1]} agency-agents templates total.`],
    [/^当前指定优先模型：(.+)$/, match => `Currently designated preferred model: ${match[1]}`],
    [/^当前后端可用 (\d+) 个创角模型(?:（(.+)）)?。稍后可以临时覆盖模型或指定固定模型。$/, match => `${match[1]} character creation models available from backend${match[2] ? ` (${match[2]})` : ''}. Override temporarily or assign a fixed model later.`],
    [/^当前角色将固定使用：(.+)$/, match => `This role will be fixed to: ${match[1]}`],
    [/^下共 (\d+) 套群聊配置（全局 (\d+)）。$/, match => `${match[1]} group chat configurations here (${match[2]} globally).`],
    [/^在(.+)中搜索“(.+)”命中 (\d+) 套（全局 (\d+)）。$/, match => `Searching "${match[2]}" in ${match[1]} matched ${match[3]} (${match[4]} globally).`],
    [/^已创建群聊配置并切换到新会话：(.+)$/, match => `Group chat configuration created and switched to new session: ${match[1]}`],
    [/^已创建群聊配置：(.+)。点击 NEW 即可用这套群组开启新会话$/, match => `Group chat configuration created: ${match[1]}. Click NEW to start a new session with this group.`],
    [/^已删除群聊配置：(.+)$/, match => `Group chat configuration deleted: ${match[1]}`],
    [/^已更新群聊配置：(.+)$/, match => `Group chat configuration updated: ${match[1]}`],
    [/^已复制群聊配置：(.+)$/, match => `Group chat configuration duplicated: ${match[1]}`],
    [/^已导入并创建新群组：(.+)$/, match => `Imported and created new group: ${match[1]}`],
    [/^已创建团队：(.+)$/, match => `Team created: ${match[1]}`],
    [/^已删除团队：(.+)$/, match => `Team deleted: ${match[1]}`],
    [/^已更新团队：(.+)$/, match => `Team updated: ${match[1]}`],
    [/^团队名称已存在，已切换到「(.+)」$/, match => `Team name already exists; switched to "${match[1]}".`],
    [/^团队仍关联 (\d+) 个历史群聊配置，无法删除$/, match => `The team is still linked to ${match[1]} historical group configurations and cannot be deleted.`],
    [/^该群聊配置已有 (\d+) 个会话，当前不允许删除$/, match => `This group chat configuration already has ${match[1]} sessions and cannot be deleted right now.`],
    [/^最多选择 (\d+) 个参考模板$/, match => `Select at most ${match[1]} reference templates`],
    [/^扫描完成：发现 (\d+) 条待补索引。$/, match => `Scan complete: ${match[1]} missing indexes found.`],
    [/^已提交 (\d+) 条记忆进入核心向量索引队列。$/, match => `${match[1]} memories submitted to the core vector index queue.`],
    [/^发送失败：(.+)$/, match => `Send failed: ${match[1]}`],
    [/^流式响应中断：(.+)$/, match => `Streaming response interrupted: ${match[1]}`],
    [/^切换会话失败：(.+)$/, match => `Switch session failed: ${match[1]}`],
    [/^初始化失败：(.+)$/, match => `Initialization failed: ${match[1]}`],
    [/^创建会话失败：(.+)$/, match => `Create session failed: ${match[1]}`],
    [/^创建团队失败：(.+)$/, match => `Create team failed: ${match[1]}`],
    [/^创建失败：(.+)$/, match => `Create failed: ${match[1]}`],
    [/^删除失败：(.+)$/, match => `Delete failed: ${match[1]}`],
    [/^生成反思失败：(.+)$/, match => `Generate reflection failed: ${match[1]}`],
    [/^更新候选记忆失败：(.+)$/, match => `Update candidate memory failed: ${match[1]}`],
    [/^扫描索引候选失败：(.+)$/, match => `Scan index candidates failed: ${match[1]}`],
    [/^补索引失败：(.+)$/, match => `Requeue index failed: ${match[1]}`],
    [/^保存失败：(.+)$/, match => `Save failed: ${match[1]}`],
    [/^部分角色执行失败：(.+)$/, match => `Some roles failed: ${match[1]}`],
    [/^确认删除团队「(.+)」吗？$/, match => `Delete team "${match[1]}"?`],
    [/^确认删除群聊配置「(.+)」吗？此操作不会删除核心角色，但会删除这套业务编排模板。$/, match => `Delete group chat configuration "${match[1]}"? This will not delete core roles, but it will delete this business orchestration template.`]
];

const REVERSE_TEXT_TRANSLATIONS = new Map(
    [...TEXT_TRANSLATIONS.entries()].map(([source, translated]) => [translated, source])
);

const TEXT_NODE_EXCLUDED_SELECTOR = [
    'script',
    'style',
    'noscript',
    'template',
    'pre',
    'code',
    'textarea',
    '#chat-messages',
    '.message-content',
    '.chat-message',
    '#header-current-group-name',
    '#header-current-session-title',
    '.group-name',
    '.chat-room-name',
    '.chat-room-summary',
    '.session-title',
    '.team-card-title',
    '.team-card-description',
    '.profile-summary-description',
    '.role-card-title',
    '.role-card-description',
    '.cognitive-member-name',
    '.cognitive-member-description',
    '.cognitive-synthesis-participant-name',
    '.cognitive-synthesis-item-content',
    '#cognitive-inspector-profile-name',
    '#cognitive-inspector-profile-summary',
    '#cognitive-inspector-charter',
    '.round-role-debug-name',
    '[data-i18n-skip]'
].join(',');

const ATTRIBUTE_EXCLUDED_SELECTOR = [
    'script',
    'style',
    'noscript',
    'template',
    'pre',
    'code',
    '#chat-messages',
    '.message-content',
    '.chat-message',
    '#header-current-group-name',
    '#header-current-session-title',
    '.group-name',
    '.chat-room-name',
    '.chat-room-summary',
    '.session-title',
    '.team-card-title',
    '.team-card-description',
    '.profile-summary-description',
    '.role-card-title',
    '.role-card-description',
    '.cognitive-member-name',
    '.cognitive-member-description',
    '.cognitive-synthesis-participant-name',
    '.cognitive-synthesis-item-content',
    '#cognitive-inspector-profile-name',
    '#cognitive-inspector-profile-summary',
    '#cognitive-inspector-charter',
    '.round-role-debug-name',
    '[data-i18n-skip]'
].join(',');

const DIALOG_WRAPPER_KEY = '__llmGroupChatI18nDialogs';

export function normalizeLocale(locale) {
    const value = String(locale || '').trim().toLowerCase();
    if (value === 'en' || value.startsWith('en-')) {
        return EN_LOCALE;
    }
    return DEFAULT_LOCALE;
}

export function getLocale() {
    return normalizeLocale(state.locale || DEFAULT_LOCALE);
}

export function isEnglishLocale(locale = getLocale()) {
    return normalizeLocale(locale) === EN_LOCALE;
}

export function initializeLocale() {
    const storedLocale = loadLocaleFromStorage(LOCALE_STORAGE_KEY, DEFAULT_LOCALE);
    return setLocale(storedLocale, { persist: false, sync: false });
}

export function setLocale(locale, { persist = true, sync = true } = {}) {
    const normalized = normalizeLocale(locale);
    state.locale = normalized;
    if (persist) {
        saveLocaleToStorage(LOCALE_STORAGE_KEY, normalized);
    }
    applyLocaleToDocument();
    if (sync) {
        syncLocalizedDom();
    }
    return normalized;
}

export function toggleLocale(options = {}) {
    return setLocale(isEnglishLocale() ? DEFAULT_LOCALE : EN_LOCALE, options);
}

export function applyLocaleToDocument(doc = getDocument()) {
    if (!doc) {
        return getLocale();
    }
    const locale = getLocale();
    doc.documentElement.lang = locale;
    doc.documentElement.dataset.locale = locale;
    doc.title = translateUiText(doc.__i18nTitleSource || REVERSE_TEXT_TRANSLATIONS.get(doc.title) || doc.title || 'AI 群聊室', locale);
    doc.__i18nTitleSource = REVERSE_TEXT_TRANSLATIONS.get(doc.title) || doc.__i18nTitleSource || 'AI 群聊室';
    updateLanguageToggle(doc, locale);
    return locale;
}

export function syncLocalizedDom(root = getDocument()) {
    const doc = root?.nodeType === 9 ? root : root?.ownerDocument || getDocument();
    if (!doc || !doc.defaultView) {
        return;
    }
    applyLocaleToDocument(doc);
    const targetRoot = root?.nodeType === 1 ? root : doc.body;
    if (!targetRoot) {
        return;
    }

    translateAttributes(targetRoot, getLocale());
    translateTextNodes(targetRoot, getLocale(), doc.defaultView.NodeFilter);
    updateLanguageToggle(doc, getLocale());
}

export function translateUiText(value, locale = getLocale()) {
    if (value === null || value === undefined) {
        return value;
    }
    const raw = String(value);
    const trimmed = raw.trim();
    if (!trimmed) {
        return raw;
    }

    const translated = translateTrimmedText(trimmed, normalizeLocale(locale));
    if (translated === trimmed) {
        return raw;
    }
    return raw.replace(trimmed, translated);
}

export function installLocalizedDialogs(win = getWindow()) {
    if (!win || win[DIALOG_WRAPPER_KEY]) {
        return;
    }
    const nativeAlert = win.alert?.bind(win);
    const nativeConfirm = win.confirm?.bind(win);
    const nativePrompt = win.prompt?.bind(win);
    win[DIALOG_WRAPPER_KEY] = { alert: nativeAlert, confirm: nativeConfirm, prompt: nativePrompt };

    if (nativeAlert) {
        win.alert = message => nativeAlert(translateUiText(message));
    }
    if (nativeConfirm) {
        win.confirm = message => nativeConfirm(translateUiText(message));
    }
    if (nativePrompt) {
        win.prompt = (message, defaultValue) => nativePrompt(translateUiText(message), defaultValue);
    }
}

function translateTrimmedText(text, locale) {
    if (locale !== EN_LOCALE) {
        return REVERSE_TEXT_TRANSLATIONS.get(text) || text;
    }
    if (TEXT_TRANSLATIONS.has(text)) {
        return TEXT_TRANSLATIONS.get(text);
    }
    for (const [pattern, translate] of PATTERN_TRANSLATIONS) {
        const match = text.match(pattern);
        if (match) {
            return translate(match);
        }
    }
    return text;
}

function translateTextNodes(root, locale, NodeFilter) {
    if (!NodeFilter) {
        return;
    }
    const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            const text = node.nodeValue || '';
            if (!text.trim() || shouldSkipTextNode(node)) {
                return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
        }
    });

    const nodes = [];
    while (walker.nextNode()) {
        nodes.push(walker.currentNode);
    }

    for (const node of nodes) {
        const current = node.nodeValue || '';
        const trimmed = current.trim();
        const source = node.__i18nSourceText || REVERSE_TEXT_TRANSLATIONS.get(trimmed) || trimmed;
        const next = translateUiText(source, locale);
        node.__i18nSourceText = source;
        node.nodeValue = current.replace(trimmed, next.trim());
    }
}

function translateAttributes(root, locale) {
    const elements = [root, ...root.querySelectorAll('*')];
    for (const element of elements) {
        if (shouldSkipAttributeElement(element)) {
            continue;
        }
        for (const attr of ATTRIBUTE_NAMES) {
            const value = element.getAttribute?.(attr);
            if (!value || !value.trim()) {
                continue;
            }
            element.__i18nAttributeSources = element.__i18nAttributeSources || {};
            const source = element.__i18nAttributeSources[attr]
                || REVERSE_TEXT_TRANSLATIONS.get(value.trim())
                || value;
            element.__i18nAttributeSources[attr] = source;
            element.setAttribute(attr, translateUiText(source, locale));
        }
    }
}

function shouldSkipTextNode(node) {
    const element = node.nodeType === 1 ? node : node.parentElement;
    return Boolean(element?.closest?.(TEXT_NODE_EXCLUDED_SELECTOR));
}

function shouldSkipAttributeElement(node) {
    const element = node.nodeType === 1 ? node : node.parentElement;
    return Boolean(element?.closest?.(ATTRIBUTE_EXCLUDED_SELECTOR));
}

function updateLanguageToggle(doc, locale) {
    const button = doc.getElementById('language-toggle');
    if (!button) {
        return;
    }
    const english = locale === EN_LOCALE;
    button.textContent = english ? '中文' : 'EN';
    button.title = english ? 'Switch to Chinese' : '切换到英文';
    button.setAttribute('aria-label', english ? 'Switch language' : '切换语言');
    button.setAttribute('aria-pressed', String(english));
}

function getDocument() {
    return typeof document === 'undefined' ? null : document;
}

function getWindow() {
    return typeof window === 'undefined' ? null : window;
}
