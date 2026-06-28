# VCPGroupChat

**Language: [中文](README.md) | English**

VCPGroupChat is the product-layer monorepo for the VCP group chat experience. It combines the browser frontend and the group chat business backend in one product project while keeping VCPToolBox as an independent core capability service.

## Star History

<p align="center">
  <a href="https://www.star-history.com/#Dullne/VCPGroupChat&Date">
    <img alt="VCPGroupChat Star History Chart" src="https://api.star-history.com/svg?repos=dullne/vcpgroupchat&type=Date">
  </a>
</p>

## Project Boundaries

```text
VCPGroupChat
  apps/frontend   Static browser UI, served same-origin by the product backend
  apps/backend    Group chat business API and frontend static host, served on port 7010 by default

External dependencies
  VCPToolBox       Core role, memory, and import APIs, usually port 6005
  PromptX          Prompt and resource files
  agency-agents    Role template resources
  model provider   OpenAI-compatible endpoint configured by GROUPCHAT_LLM_*
```

The frontend and business backend belong together and run as one `groupchat-app` container in the default Docker Compose setup. This keeps the group chat product easier to develop, test, and start as a unit. VCPToolBox stays separate because it is the core capability layer, not the product UI or product orchestration layer.

## Quick Start

From this directory:

```bash
cp apps/backend/config.env.example apps/backend/config.env
docker compose up --build
```

Open the product UI:

```text
http://127.0.0.1:7010
```

The backend API listens on the same origin:

```text
http://127.0.0.1:7010
```

By default, the backend expects VCP core to be reachable from the container via:

```text
http://host.docker.internal:6005
```

Override it when needed:

```bash
VCP_CORE_URL=http://host.docker.internal:6005 docker compose up --build
```

## Model Configuration

Group chat model calls are owned by `apps/backend` and must use the backend configuration below. They do not fall back to VCPToolBox core model settings.

Configure these in `apps/backend/config.env`:

```env
GROUPCHAT_LLM_PROVIDER=
GROUPCHAT_LLM_BASE_URL=
GROUPCHAT_LLM_API_KEY=
GROUPCHAT_ROLE_MODEL=
GROUPCHAT_ROLE_FALLBACK_MODELS=
GROUPCHAT_ROLE_STUDIO_MODELS=
```

`VCP_CORE_URL` and `VCP_CORE_KEY` are only for VCP core business APIs such as role storage, import APIs, and memory APIs.

## Local Development

Product backend only:

```bash
cd apps/backend
npm install
npm test
npm start
```

By default, the backend also serves the static files from `apps/frontend`. Open:

```text
http://127.0.0.1:7010
```

Frontend-only debugging:

```bash
cd apps/frontend
python3 -m http.server 4090
```

The standalone frontend uses `config_backend.js` to call `http://127.0.0.1:7010` automatically.

Run product-level checks from the monorepo root:

```bash
npm run test
```

The root `test` script runs backend tests and lightweight frontend i18n checks. Live smoke tests require the product app to be running first.

## Git And Security Hygiene

Do not commit local secrets, runtime databases, cache folders, browser automation output, or coordination state. The root `.gitignore` excludes the known runtime paths, and the backend keeps its own `config.env.example` as the only committed environment template.

## Migration Notes

This monorepo was created by migrating the earlier standalone frontend and business backend into `apps/frontend` and `apps/backend`. The original repositories can remain as source or history references; this repository is the product-layer home going forward.
