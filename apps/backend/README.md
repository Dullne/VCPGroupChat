# GroupChatBackend

GroupChatBackend is the business backend for VCP group chat. It owns the group
chat API, session orchestration, person/template bindings, role studio flows,
memory candidate review, and the bridge between the group chat frontend and the
VCP core service.

It is intentionally separate from the VCP core project:

- GroupChatBackend handles product workflows for group chat.
- VCP core provides core role storage, memory APIs, and import APIs. It is not
  used as GroupChatBackend's model gateway.
- LLMGroupChat is the browser frontend that talks to this backend.

## Quick Start

```bash
cp config.env.example config.env
npm install
npm test
npm start
```

The default backend port is `7010`.

For local Docker debugging:

```bash
docker compose up --build
```

For the product frontend plus backend stack, use the compose file in the
VCPGroupChat repository root.

## Configuration

All local secrets belong in `config.env`. Do not commit `config.env`.

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

## Model And Key Boundaries

GroupChatBackend can use its own OpenAI-compatible model provider. This is
separate from the VCP core project's model configuration.

Use these variables when GroupChatBackend should call its own model endpoint for
group chat role replies and role studio draft generation:

- `GROUPCHAT_LLM_PROVIDER`: optional label for the provider.
- `GROUPCHAT_LLM_BASE_URL`: OpenAI-compatible base URL, for example a `/v1`
  endpoint. This is required for GroupChatBackend model calls.
- `GROUPCHAT_LLM_API_KEY`: API key for the backend-owned model endpoint. Keep it
  only in local or deployment secrets.
- `GROUPCHAT_ROLE_MODEL`: optional first-choice model for group chat role
  replies.
- `GROUPCHAT_ROLE_FALLBACK_MODELS`: optional comma-separated fallback model list
  for group chat role replies.
- `GROUPCHAT_ROLE_STUDIO_MODELS`: optional comma-separated model list for role
  studio draft generation.

Use these variables for VCP core connectivity:

- `VCP_CORE_URL`: URL of the VCP core service.
- `VCP_CORE_KEY`: optional key for authenticating requests to VCP core.

The two key sets are independent. A deployment may configure both:

- `GROUPCHAT_LLM_API_KEY` for GroupChatBackend's own model calls.
- `VCP_CORE_KEY` for secured access from GroupChatBackend to VCP core.

If `GROUPCHAT_LLM_BASE_URL` is empty, GroupChatBackend model calls fail with a
configuration error. Core role APIs, import APIs, and memory APIs still go
through `VCP_CORE_URL`.

## Tests

```bash
npm test
```

Container test helper:

```bash
npm run test:container
```

See `TESTING.md` for the current smoke and hygiene commands.

## Git Hygiene

The repository tracks source, tests, scripts, Docker files, and example
configuration only. Runtime data and secrets are ignored:

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

Do not commit real API keys, tokens, runtime SQLite databases, local caches, or
machine-specific coordination state.
