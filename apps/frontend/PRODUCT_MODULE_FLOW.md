# VCPGroupChat 前端产品模块流

## 1. 能力边界

- 核心认知层（VCPToolBox）：
  - 运行时角色认知、模板、记忆、外部模板源（PromptX / agency-agents）
  - 不负责团队/群组业务编排
- 群聊产品后端（VCPGroupChat Backend）：
  - Team / GroupProfile / Session 生命周期，其中 GroupProfile 是内部群聊配置
  - 人物成员编排（把长期人物加入团队和群聊，并维护运行时角色兼容镜像）
  - 会话执行编排（转发到核心 role-turn）
- 群聊前端（VCPGroupChat Frontend）：
  - 微信式群聊列表、发起群聊、会话操作
  - 团队人物池管理、人物工坊（一句话创建人物）、人物通讯录与模板目录

## 2. 前端模块

- Chat Sidebar / Launcher
  - 左侧群聊列表：一个群聊就是一个持续入口
  - 发起群聊：从人物通讯录选择长期人物、填写群名、创建后立即进入聊天
  - Session 作为历史实现细节，不作为普通用户主导航
- Team Person Pool
  - 团队管理（创建、更新、删除）
  - 从人物通讯录按标签/关键词拉长期人物进团队
  - 团队只负责候选人物池，不负责日常建群入口
- Internal Group Config
  - GroupProfile CRUD 是内部配置能力，用于兼容历史数据和高级编排
  - 群聊模式配置（`sequential` / `invite_only` / `naturerandom`）
  - 邀请制发言提示配置（群聊级 invite_prompt）
  - 普通用户优先通过“发起群聊”创建配置，不直接理解模板概念
- Person Studio
  - 一句话生成人物草稿
  - 临时角色创建与运行模型绑定
- People & Templates
  - 浏览 PromptX / agency-agents 目录
  - 区分长期人物、外部模板和运行时角色
  - 外部模板用于创建人物；运行时角色用于绑定；只有长期人物可加入团队或群组

## 3. 关键用户路径

1. 从左侧点击“+ 发起群聊”
2. 从人物通讯录按标签或关键词选择长期人物
3. 填写群聊名称和一句话说明
4. 创建后立即进入这个群聊入口，历史继续留在左侧同一个入口里
5. 若缺人物，在人物工坊一句话创建人物，或从人物与模板中的模板创建人物，再回到发起群聊或人物与模板里加入

## 4. 参考 VCPChat 吸收点

- 明确的“业务编排层”与“角色认知层”分工
- 以群聊为中心的成员治理思路（谁在场、谁参与本轮）
- 保留后续扩展位：群聊模式策略（顺序/随机/邀请制）可作为下一阶段加入 GroupProfile

## 5. 当前模式执行规则（已落地）

- `sequential`：默认模式，群聊成员按既有编排参与（可点名覆盖）。
- `invite_only`：必须点名才发言。
  - 可通过“本轮点名”勾选角色。
  - 或在消息中使用 `@角色名 / @tag` 触发。
- `naturerandom`：自然随机。
  - 若消息中点名（`@角色名 / @tag`），优先由被点名角色发言。
  - 未点名时，从可用角色中随机抽样发言（约 2-3 位）。
  - 支持调参：`random_min_speakers` / `random_max_speakers` / `mention_mode(priority|additive|ignore)`。
