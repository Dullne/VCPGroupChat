# GroupChatBackend Testing

## Normal Test Commands

- Host runtime: `npm test`
- Repair host native modules, then test: `npm run test:host:repair`
- Running Docker container: `npm run test:container`
- Continuous live stack smoke: `npm run test:continuous`

## Continuous Smoke

`npm run test:continuous` is a host-side smoke runner for the live GroupChat
stack. It runs the app container tests, checks the live product origin at
`http://127.0.0.1:7010`, verifies `/api/bootstrap` and gzipped `/api/roles` stay on the
`role-summary-v1` summary contract, and then runs every `apps/frontend/tests/*.mjs`
smoke test.

The default byte budgets are:

- `/api/bootstrap` payload: `200000`
- `/api/roles` uncompressed payload: `200000`
- `/api/roles` gzip response: `12000`

Override them with `GROUPCHAT_BOOTSTRAP_BUDGET_BYTES`,
`GROUPCHAT_ROLE_LIST_PAYLOAD_BUDGET_BYTES`, and
`GROUPCHAT_ROLES_GZIP_BUDGET_BYTES` when intentionally changing payload size.
The deterministic continuous smoke does not call the model-backed streaming
round endpoint; keep model stream verification as an explicit manual or opt-in
check so regular smoke runs stay stable.

## Host `better-sqlite3` ABI

`better-sqlite3` ships a native Node addon. The addon is compiled for one
`NODE_MODULE_VERSION`, so host tests can fail after switching Node versions even
when the JavaScript code is unchanged.

The failure looks like this:

```text
better_sqlite3.node was compiled against a different Node.js version
```

When that happens, rebuild the native addon for the current host Node runtime:

```sh
npm run rebuild:native
npm test
```

The container test runtime is independent from the host `node_modules` ABI. Use
`npm run test:container` when validating the running `vcp-groupchat-app`
container.
