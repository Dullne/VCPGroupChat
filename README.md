# VCPGroupChat

**语言：中文 | [English](README.en.md)**

VCPGroupChat 是 VCP 群聊产品层的 monorepo。它把浏览器前端和群聊业务后端放在同一个产品项目里，同时保持 VCPToolBox 作为独立的核心能力服务。

## 项目边界

```text
VCPGroupChat
  apps/frontend   静态浏览器界面，默认端口 4090
  apps/backend    群聊业务 API，默认端口 7010

外部依赖
  VCPToolBox       核心角色、记忆和导入 API，通常运行在 6005
  PromptX          Prompt 和资源文件
  agency-agents    角色模板资源
  model provider   由 GROUPCHAT_LLM_* 配置的 OpenAI 兼容模型端点
```

前端和业务后端属于同一个产品项目，因为群聊产品能力通常会同时改动 UI、接口和编排逻辑。VCPToolBox 保持独立，因为它是核心能力层，不是产品界面或产品编排层。

## 快速启动

在本目录执行：

```bash
cp apps/backend/config.env.example apps/backend/config.env
docker compose up --build
```

打开前端：

```text
http://127.0.0.1:4090
```

后端默认监听：

```text
http://127.0.0.1:7010
```

默认情况下，后端会从容器内访问 VCP core：

```text
http://host.docker.internal:6005
```

需要时可以覆盖：

```bash
VCP_CORE_URL=http://host.docker.internal:6005 docker compose up --build
```

## 模型配置

群聊模型调用由 `apps/backend` 拥有，必须使用后端自己的配置。它不会回退使用 VCPToolBox 核心项目的模型配置。

在 `apps/backend/config.env` 中配置：

```env
GROUPCHAT_LLM_PROVIDER=
GROUPCHAT_LLM_BASE_URL=
GROUPCHAT_LLM_API_KEY=
GROUPCHAT_ROLE_MODEL=
GROUPCHAT_ROLE_FALLBACK_MODELS=
GROUPCHAT_ROLE_STUDIO_MODELS=
```

`VCP_CORE_URL` 和 `VCP_CORE_KEY` 只用于访问 VCP core 的业务 API，例如角色存储、导入 API 和记忆 API。

## 本地开发

仅运行后端：

```bash
cd apps/backend
npm install
npm test
npm start
```

仅运行前端：

```bash
cd apps/frontend
python3 -m http.server 4090
```

在 monorepo 根目录运行产品级检查：

```bash
npm run test
```

根目录的 `test` 脚本会运行后端测试和轻量前端 i18n 检查。真实前端 smoke 测试可能需要先启动前端和后端服务。

## Git 和安全约定

不要提交本地密钥、运行时数据库、缓存目录、浏览器自动化输出或协作状态。根目录 `.gitignore` 已排除已知运行时路径；后端只提交 `config.env.example` 作为环境变量模板。

## 迁移说明

这个 monorepo 是通过复制当前产品前端 `LLMGroupChat` 到 `apps/frontend`，以及复制当前产品后端 `GroupChatBackend` 到 `apps/backend` 创建的。原始仓库可以继续作为源码或历史参考；后续产品层开发以本仓库为主。
