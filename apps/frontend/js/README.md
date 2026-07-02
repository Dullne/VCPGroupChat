# VCPGroupChat Frontend Module Map

This directory contains the current ES module frontend for the VCP group chat UI.
`index.html` now loads the ES module runtime directly.

## Runtime Entry

```html
<script type="module" src="js/core/app.js"></script>
```

- `core/app.js` is intentionally thin and imports `core/app.modular.js`.
- `core/app.modular.js` composes the app runtime from smaller modules.
- `config_backend.js` provides `window.loadedConfig` for the frontend backend URL.

## Main Layers

- `api/`
  - Thin API wrappers for group chat backend resources.
  - Covers teams, group profiles, sessions, people, runtime roles, and related operations.
- `core/`
  - Application state, bootstrap, selectors, event bindings, actions, runtime wiring, and business UI orchestration.
  - This is where user actions are translated into backend calls and UI refreshes.
- `ui/`
  - Renderers and view helpers for chat messages, sidebar, workspace modal, role library, person studio, team/group management, launcher, and runtime widgets.
- `utils/`
  - Shared formatting, HTTP, random, and UI helper functions.

## Product Surface

The current UI is organized around a WeChat-style group chat model:

- Left sidebar: one visible chat list, where one group chat is one continuing entry.
- `发起群聊`: simple launcher flow for selecting AI members, naming the group chat, and immediately entering the new session.
- Team: person pool management for grouping long-lived people.
- Role library: people, templates, and runtime-role browsing surface.
- Person studio: person draft and creation surface.
- Right panel: cognitive inspector and runtime participation controls.

## Compatibility Notes

- Hidden compatibility controls such as `#config-select`, `#chat-session-select`, and `#sidebar-session-list` are still present because existing modules use them as internal state anchors.
- Do not remove those compatibility nodes until the dependent modules are explicitly migrated away from them.
- `core/app.modular.thin-backup.js` is a local safety backup and should not be used as the active entry.

## Local Artifacts

- `.playwright-cli/` and `output/` are local verification artifacts and are ignored by git.
- `*.backup` files are local safety snapshots and are ignored by git.
