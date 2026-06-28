# VCPGroupChat

VCPGroupChat is the product-layer monorepo for the VCP group chat experience.
It combines the browser frontend and the group chat business backend in one
product project while keeping VCPToolBox as an independent core service.

## Project Boundaries

```text
VCPGroupChat
  apps/frontend   Static browser UI, served on port 4090
  apps/backend    Group chat business API, served on port 7010

External dependencies
  VCPToolBox       Core role, memory, and import APIs, usually port 6005
  PromptX          Prompt/resource files
  agency-agents    Role template resources
  model provider   OpenAI-compatible endpoint configured by GROUPCHAT_LLM_*
```

The frontend and business backend belong together because product features
usually change across both layers. VCPToolBox stays separate because it is the
core capability layer, not the product UI or product orchestration layer.

## Quick Start

From this directory:

```bash
cp apps/backend/config.env.example apps/backend/config.env
docker compose up --build
```

Open:

```text
http://127.0.0.1:4090
```

The backend listens on:

```text
http://127.0.0.1:7010
```

By default the backend expects VCP core to be reachable from the container via:

```text
http://host.docker.internal:6005
```

Override it when needed:

```bash
VCP_CORE_URL=http://host.docker.internal:6005 docker compose up --build
```

## Model Configuration

Group chat model calls are owned by `apps/backend` and must use the backend
configuration below. They do not fall back to VCPToolBox core model settings.

Configure these in `apps/backend/config.env`:

```env
GROUPCHAT_LLM_PROVIDER=
GROUPCHAT_LLM_BASE_URL=
GROUPCHAT_LLM_API_KEY=
GROUPCHAT_ROLE_MODEL=
GROUPCHAT_ROLE_FALLBACK_MODELS=
GROUPCHAT_ROLE_STUDIO_MODELS=
```

`VCP_CORE_URL` and `VCP_CORE_KEY` are only for VCP core business APIs such as
role storage, import APIs, and memory APIs.

## Local Development

Backend only:

```bash
cd apps/backend
npm install
npm test
npm start
```

Frontend only:

```bash
cd apps/frontend
python3 -m http.server 4090
```

Run product-level checks from the monorepo root:

```bash
npm run test
```

The root `test` script runs backend tests and lightweight frontend i18n checks.
Live frontend smoke tests may require the backend and frontend services to be
running first.

## Git Hygiene

Do not commit local secrets, runtime databases, cache folders, browser
automation output, or coordination state. The root `.gitignore` excludes the
known runtime paths, and the backend keeps its own `config.env.example` as the
only committed environment template.

## Migration Notes

This monorepo was created by copying the current product frontend from
`LLMGroupChat` into `apps/frontend` and the current product backend from
`GroupChatBackend` into `apps/backend`. The original repositories can remain as
source/history references; this repository is the product-layer home going
forward.
