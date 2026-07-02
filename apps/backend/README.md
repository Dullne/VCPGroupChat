# VCPGroupChat Backend

**语言：中文 | [English](README.en.md)**

VCPGroupChat Backend 是 VCPGroupChat 产品内的业务后端包。它负责群聊 API、会话编排、人物和角色模板绑定、角色工作室流程、记忆候选审核，以及 `apps/frontend` 和 VCP core 服务之间的桥接。

它和 VCP core 项目是刻意分离的：

- VCPGroupChat Backend 处理群聊产品工作流。
- VCP core 提供运行时角色、记忆 API 和执行能力；它不是产品后端的模型网关。
- `apps/frontend` 是访问这个后端的浏览器前端。

## 快速启动

```bash
cp config.env.example config.env
npm install
npm test
npm start
```

默认端口是 `7010`。在产品栈中，这个服务同时提供后端 API 和 `apps/frontend` 静态页面。

本地 Docker 调试：

```bash
docker compose up --build
```

这个子目录 compose 只用于 standalone 调试。默认产品运行方式是在 VCPGroupChat 仓库根目录执行 `docker compose up --build`，启动一个 `groupchat-app` 容器并打开 `http://127.0.0.1:7010`。

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

VCPGroupChat Backend 可以使用自己的 OpenAI 兼容模型提供方。它和 VCP core 项目的模型配置完全分开。

当产品后端需要为群聊人物回复或角色工作室草稿生成调用自己的模型端点时，使用这些变量：

- `GROUPCHAT_LLM_PROVIDER`：可选的提供方标签。
- `GROUPCHAT_LLM_BASE_URL`：OpenAI 兼容 base URL，例如 `/v1` 端点。产品后端发起模型调用时必须配置它。
- `GROUPCHAT_LLM_API_KEY`：后端自有模型端点的 API key，只能放在本地或部署密钥里。
- `GROUPCHAT_ROLE_MODEL`：群聊人物回复的可选首选模型。
- `GROUPCHAT_ROLE_FALLBACK_MODELS`：群聊人物回复的可选逗号分隔 fallback 模型列表。
- `GROUPCHAT_ROLE_STUDIO_MODELS`：角色工作室草稿生成的可选逗号分隔模型列表。

访问 VCP core 使用这些变量：

- `VCP_CORE_URL`：VCP core 服务地址。
- `VCP_CORE_KEY`：访问 VCP core 时可选的鉴权 key。

这两组 key 彼此独立。一个部署可以同时配置：

- `GROUPCHAT_LLM_API_KEY`：用于产品后端自己的模型调用。
- `VCP_CORE_KEY`：用于产品后端安全访问 VCP core。

如果 `GROUPCHAT_LLM_BASE_URL` 为空，产品后端的模型调用会返回配置错误。运行时角色 API 和记忆 API 仍然通过 `VCP_CORE_URL` 访问。

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
