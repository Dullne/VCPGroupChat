# VCPGroupChat Frontend Runtime Notes

Last audited: 2026-06-28

This directory contains the browser UI for VCPGroupChat. In the default product
runtime, the frontend is served by the VCPGroupChat product backend from the
same `groupchat-app` container on port `7010`.

## Current Runtime Entry

- `index.html`
- `style.css`
- `css/style-fixes.css`
- `css/role-library-enhancements.css`
- `css/layout-three-column.css`
- `css/ui-components.css`
- `css/frontend-polish.css`
- `marked.min.js`
- `js/core/app.js`
- `config_backend.js`

## Default Product Runtime

Run from the repository root:

```bash
docker compose up --build
```

Open:

```text
http://127.0.0.1:7010
```

The default product runtime does not start a separate frontend container.

## Standalone Frontend Debugging

These files remain only for frontend-only debugging:

- `docker-compose.yml`
- `nginx.conf`
- `Start.Bat`

Standalone debugging uses port `4090` and calls the product backend on `7010`
through `config_backend.js`.

## Files Intentionally Ignored

- `.playwright-cli/`
  - Local Playwright snapshots/screenshots.
- `output/`
  - Local verification screenshots.
- `*.backup`
  - Local safety snapshots such as `index.html.backup`.
- `js/core/app.modular.thin-backup.js`
  - Local safety backup. The active entry is `js/core/app.js`.
- `layout-refactor.css`
  - Superseded local layout draft. The active layout file is
    `css/layout-three-column.css`, further refined by `css/frontend-polish.css`
    and `css/style-fixes.css`.

## Why `layout-refactor.css` Is Ignored

- It is not referenced by `index.html`.
- It overlaps with `css/layout-three-column.css`.
- It still describes an older three-row layout with an `input` grid area, while
  the current app uses the active three-column layout plus polish layers.
- It is kept out of the tracked runtime as a local draft.

## Historical Runtime Cleanup

The former standalone frontend entry/config files are no longer part of the
tracked runtime and should not be reintroduced. Current product runtime data
comes from VCPGroupChat product backend APIs.

## Verification Commands

```bash
find apps/frontend/js -type f -name '*.js' -print | sort | while IFS= read -r f; do
  node --check "$f" || exit 1
done

curl -I --max-time 5 http://127.0.0.1:7010/
curl -sS --max-time 5 http://127.0.0.1:7010/api/bootstrap
```

Expected current smoke result:

- product UI `7010`: `200 OK`
- backend bootstrap: profiles, teams, and roles returned

## Local Data Note

Smoke tests and browser checks may create local validation group chats in the
ignored backend database. Those records are runtime data and should not be
committed.

## Compatibility Notes

- Hidden compatibility nodes remain in `index.html` because modules still use
  them as internal state anchors:
  - `#config-select`
  - `#chat-session-select`
  - `#sidebar-session-list`
- Do not remove those nodes until the dependent modules are migrated.
