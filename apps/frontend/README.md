# VCPGroupChat Frontend

**语言：中文 | [English](README.en.md)**

这是 VCPGroupChat 的静态浏览器前端。

在默认产品 Docker Compose 栈中，它由 GroupChatBackend 同源托管，不再需要单独的 Nginx 前端容器。独立调试时，它仍然通过 `config_backend.js` 里的 `window.loadedConfig.BackendUrl` 访问业务后端。

## 本地运行

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

产品栈默认直接打开：

```text
http://127.0.0.1:7010
```

## 测试

可以从产品根目录运行轻量测试：

```bash
npm run frontend:test:i18n
```

部分 smoke 测试需要先启动产品 app。

## 说明

这个前端不再通过旧的独立 `config_default.js` 和 `script.js` 流程配置。产品运行时数据来自 GroupChatBackend API。
