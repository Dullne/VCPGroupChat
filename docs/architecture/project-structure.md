# Project Structure

## Decision

VCPGroupChat is a product monorepo:

```text
apps/frontend
apps/backend
```

VCPToolBox, PromptX, and agency-agents stay outside this repository as external
dependencies.

## Rationale

Group chat product work crosses frontend and backend boundaries: session flows,
role studio, person identity, group profiles, memory review, realtime sync, and
project asset workflows all require matching UI, API, and documentation changes.
Keeping the frontend and business backend in one product repository makes those
changes easier to review, test, and ship together.

VCPToolBox remains separate because it owns core capabilities, not product
presentation or product orchestration. The product backend talks to VCPToolBox
through `VCP_CORE_URL` and keeps its own model provider configuration through
`GROUPCHAT_LLM_*`.

## Runtime Flow

```text
Browser
  -> groupchat-app on port 7010
       -> apps/frontend static files
       -> apps/backend product API
  -> VCPToolBox core on port 6005
  -> external model provider through GROUPCHAT_LLM_BASE_URL
```

The product frontend and product backend run in one default container because
they are one deployable product surface. VCPToolBox remains a separate runtime
because it is a reusable core capability service.

## Operational Boundaries

- Frontend config is same-origin when served by `groupchat-app`.
- Frontend-only local debugging can still run on port `4090` and call the backend
  on port `7010`.
- Backend core API config is `VCP_CORE_*`.
- Backend model provider config is `GROUPCHAT_LLM_*`.
- PromptX and agency-agents are mounted or referenced as readonly resources.
- Runtime SQLite data and local env files are not committed.

## Data Boundaries

- `apps/backend` owns the product database: teams, persons, group profiles,
  sessions, messages, reflections, memory candidates, and project syntheses.
- VCPToolBox owns core databases and vector stores such as `VectorStore` and
  plugin state. Product data and core data stay physically separate.
