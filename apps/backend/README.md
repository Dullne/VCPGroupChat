# GroupChatBackend

**语言：中文 | [English](README.en.md)**

GroupChatBackend 是 VCP 群聊产品的业务后端。它负责群聊 API、会话编排、人物和角色模板绑定、角色工作室流程、记忆候选审核，以及群聊前端和 VCP core 服务之间的桥接。

它和 VCP core 项目是刻意分离的：

- GroupChatBackend 处理群聊产品工作流。
- VCP core 提供核心角色存储、记忆 API 和导入 API；它不是 GroupChatBackend 的模型网关。
- VCPGroupChat Frontend 是访问这个后端的浏览器前端。

## 快速启动

```bash
cp config.env.example config.env
npm install
npm test
npm start
```

默认后端端口是 `7010`。

本地 Docker 调试：

```bash
docker compose up --build
```

如果要启动产品前端加后端的完整栈，请使用 VCPGroupChat 仓库根目录的 compose 文件。

## 配置

所有本地密钥都放在 `config.env`。不要提交 `config.env`。

```env
PORT=7010
VCP_CORE_URL=http://127.0.0.1:6005
VCP_CORE_KEY=

GROUPCHAT_LLM_PROVIDER=
GROUPCHAT_LLM_BASE_URL=
GROUPCHAT_LLM_API_KEY=

GROUPCHAT_USER_NAME=用户
GROUPCHAT_USER_PROMPT=用户是当前任务的最终决策者。
GROUPCHAT_ROLE_MODEL=
GROUPCHAT_ROLE_FALLBACK_MODELS=bytedance-seed/seed-1.6-flash,qwen/qwen3.5-flash-02-23,z-ai/glm-4.7-flash,qwen/qwen3.6-plus-preview:free
GROUPCHAT_ROLE_STUDIO_MODELS=bytedance-seed/seed-1.6-flash,qwen/qwen3.5-flash-02-23,z-ai/glm-4.7-flash,qwen/qwen3.6-plus-preview:free
GROUPCHAT_ROLE_STUDIO_TEMPERATURE=0.35
GROUPCHAT_ROLE_STUDIO_MAX_TOKENS=1600
GROUPCHAT_DISABLED_MODELS=qwen/qwen3.6-plus-preview:free
GROUPCHAT_MODEL_FAILURE_COOLDOWN_SECONDS=300
PROMPTX_RESOURCE_DIR=../PromptX/packages/resource
AGENCY_AGENTS_DIR=../agency-agents
```

## 模型和 Key 边界

GroupChatBackend 可以使用自己的 OpenAI 兼容模型提供方。它和 VCP core 项目的模型配置完全分开。

当 GroupChatBackend 需要为群聊人物回复或角色工作室草稿生成调用自己的模型端点时，使用这些变量：

- `GROUPCHAT_LLM_PROVIDER`：可选的提供方标签。
- `GROUPCHAT_LLM_BASE_URL`：OpenAI 兼容 base URL，例如 `/v1` 端点。GroupChatBackend 发起模型调用时必须配置它。
- `GROUPCHAT_LLM_API_KEY`：后端自有模型端点的 API key，只能放在本地或部署密钥里。
- `GROUPCHAT_ROLE_MODEL`：群聊人物回复的可选首选模型。
- `GROUPCHAT_ROLE_FALLBACK_MODELS`：群聊人物回复的可选逗号分隔 fallback 模型列表。
- `GROUPCHAT_ROLE_STUDIO_MODELS`：角色工作室草稿生成的可选逗号分隔模型列表。

访问 VCP core 使用这些变量：

- `VCP_CORE_URL`：VCP core 服务地址。
- `VCP_CORE_KEY`：访问 VCP core 时可选的鉴权 key。

这两组 key 彼此独立。一个部署可以同时配置：

- `GROUPCHAT_LLM_API_KEY`：用于 GroupChatBackend 自己的模型调用。
- `VCP_CORE_KEY`：用于 GroupChatBackend 安全访问 VCP core。

如果 `GROUPCHAT_LLM_BASE_URL` 为空，GroupChatBackend 的模型调用会返回配置错误。核心角色 API、导入 API 和记忆 API 仍然通过 `VCP_CORE_URL` 访问。

## 测试

```bash
npm test
```

容器测试辅助命令：

```bash
npm run test:container
```

当前 smoke 和卫生检查命令见 `TESTING.md`。

## Git 和安全约定

仓库只跟踪源码、测试、脚本、Docker 文件和示例配置。运行时数据和密钥会被忽略：

```text
config.env
.env
.env.*
data/
*.db
*.db-shm
*.db-wal
node_modules/
.npm-cache/
.hello-cc/
.DS_Store
*.log
```

不要提交真实 API key、token、运行时 SQLite 数据库、本地缓存或机器相关的协作状态。
