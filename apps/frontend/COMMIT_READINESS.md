# VCPGroupChat Frontend Commit Readiness Inventory

Last audited: 2026-06-22

This repo is in the middle of a large frontend modularization and product UX
migration. The app runs from ES modules now; the old `script.js` entry is no
longer used by `index.html`.

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

## Files That Should Be Included In The Migration Commit

Core tracked changes:

- `index.html`
- `style.css`
- delete `script.js`
- delete `config_default.js`

New runtime/config files:

- `.gitignore`
- `config_backend.js`
- `docker-compose.yml` (standalone frontend debugging only)
- `nginx.conf` (standalone frontend debugging only)
- `favicon.svg`
- `css/`
- `js/`

Product and architecture docs:

- `COMMIT_READINESS.md`
- `COGNITIVE_ROLE_CHAT_PLAN.md`
- `PRODUCT_MODULE_FLOW.md`

Role source data:

- `role_registry_agency.json`

## Files Intentionally Ignored

- `.playwright-cli/`
  - Local Playwright snapshots/screenshots.
- `output/`
  - Local verification screenshots.
- `*.backup`
  - Local safety snapshots such as `index.html.backup`.
- `js/core/app.modular.thin-backup.js`
  - Migration safety backup. The active entry is `js/core/app.js`.
- `layout-refactor.css`
  - Superseded local layout draft. The active layout file is
    `css/layout-three-column.css`, further refined by `css/frontend-polish.css`
    and `css/style-fixes.css`.

## Why `layout-refactor.css` Is Not A Commit Candidate

- It is not referenced by `index.html`.
- It overlaps with `css/layout-three-column.css`.
- It still describes an older three-row layout with an `input` grid area, while
  the current app uses the active three-column layout plus polish layers.
- Keeping it untracked would create confusion during review, so it is ignored as
  a local draft instead of being deleted.

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

## Known Local Test Data

The local backend currently contains validation group chats whose names include
`验收`, `Launcher`, or `Wizard`. They were created by browser-based end-to-end
checks and can be cleaned separately if a clean demo database is needed.

## Review Risks Before Commit

- This is a large migration: reviewers should inspect it as a product/frontend
  rewrite rather than a small patch.
- Hidden compatibility nodes remain in `index.html` because modules still use
  them as internal state anchors:
  - `#config-select`
  - `#chat-session-select`
  - `#sidebar-session-list`
- Do not remove those nodes until the dependent modules are migrated.
