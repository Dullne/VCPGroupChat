# VCPGroupChat

**语言：中文 | [English](README.en.md)**

VCPGroupChat 是 VCP 群聊产品层的 monorepo。它把浏览器前端和群聊业务后端放在同一个产品项目里，同时保持 VCPToolBox 作为独立的核心能力服务。

## 项目边界

```text
VCPGroupChat
  apps/frontend   静态浏览器界面，由产品后端同源托管
  apps/backend    群聊业务 API 和前端静态托管，默认端口 7010

外部依赖
  VCPToolBox       核心运行时角色、记忆和模型能力，通常运行在 6005
  PromptX          Prompt 和资源文件
  agency-agents    角色模板资源
  model provider   由 GROUPCHAT_LLM_* 配置的 OpenAI 兼容模型端点
```

前端和业务后端属于同一个产品项目，并在默认 Docker Compose 中作为一个 `groupchat-app` 容器运行。这样群聊产品能力可以一起开发、测试和启动。VCPToolBox 保持独立，因为它是核心能力层，不是产品界面或产品编排层。

## 快速启动

在本目录执行：

```bash
cp apps/backend/config.env.example apps/backend/config.env
docker compose up --build
```

打开产品界面：

```text
http://127.0.0.1:7010
```

后端 API 同源监听：

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

`VCP_CORE_URL` 和 `VCP_CORE_KEY` 只用于访问 VCP core 的业务 API，例如运行时角色、记忆和模型相关 API。

## 本地开发

仅运行产品后端：

```bash
cd apps/backend
npm install
npm test
npm start
```

默认情况下，后端会自动托管 `apps/frontend` 的静态文件。打开：

```text
http://127.0.0.1:7010
```

仅独立调试前端：

```bash
cd apps/frontend
python3 -m http.server 4090
```

独立前端会通过 `config_backend.js` 自动访问 `http://127.0.0.1:7010`。

在 monorepo 根目录运行产品级检查：

```bash
npm run test
```

根目录的 `test` 脚本会运行后端测试和轻量前端 i18n 检查。真实 smoke 测试需要先启动产品 app。

## Git 和安全约定

不要提交本地密钥、运行时数据库、缓存目录、浏览器自动化输出或协作状态。根目录 `.gitignore` 已排除已知运行时路径；后端只提交 `config.env.example` 作为环境变量模板。

## 迁移说明

这个 monorepo 是通过迁移早期独立前端和业务后端到 `apps/frontend`、`apps/backend` 创建的。原始仓库可以继续作为源码或历史参考；后续产品层开发以本仓库为主。

## Star 历史

<p align="center">
  <a href="https://www.star-history.com/#Dullne/VCPGroupChat&Date">
    <img alt="VCPGroupChat Star 历史图" src="https://api.star-history.com/svg?repos=dullne/vcpgroupchat&type=Date">
  </a>
</p>
