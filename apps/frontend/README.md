# VCPGroupChat Frontend

## 中文

这是 VCPGroupChat 的静态浏览器前端。

在产品 Docker Compose 栈中，它由 Nginx 提供静态服务，并通过 `config_backend.js` 里的 `window.loadedConfig.BackendUrl` 访问业务后端。

### 本地运行

```bash
python3 -m http.server 4090
```

打开：

```text
http://127.0.0.1:4090
```

默认后端地址：

```text
http://127.0.0.1:7010
```

### 测试

可以从产品根目录运行轻量测试：

```bash
npm run frontend:test:i18n
```

部分 smoke 测试需要先启动前端和后端。

### 说明

这个前端不再通过旧的独立 `config_default.js` 和 `script.js` 流程配置。产品运行时数据来自 GroupChatBackend API。

---

## English

This is the static browser frontend for VCPGroupChat.

In the product Docker Compose stack, it is served by Nginx and talks to the business backend through `window.loadedConfig.BackendUrl` in `config_backend.js`.

### Local Run

```bash
python3 -m http.server 4090
```

Open:

```text
http://127.0.0.1:4090
```

The default backend URL is:

```text
http://127.0.0.1:7010
```

### Tests

Lightweight tests can be run from the product root:

```bash
npm run frontend:test:i18n
```

Some smoke tests require a running frontend and backend.

### Notes

This app is no longer configured through the old standalone `config_default.js` and `script.js` flow. Product runtime data comes from GroupChatBackend APIs.
