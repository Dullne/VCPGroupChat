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
  -> apps/frontend on port 4090
  -> apps/backend on port 7010
  -> VCPToolBox core on port 6005
  -> external model provider through GROUPCHAT_LLM_BASE_URL
```

## Operational Boundaries

- Frontend config points to the product backend, not directly to VCPToolBox.
- Backend core API config is `VCP_CORE_*`.
- Backend model provider config is `GROUPCHAT_LLM_*`.
- PromptX and agency-agents are mounted or referenced as readonly resources.
- Runtime SQLite data and local env files are not committed.
