# VCPGroupChat Frontend

This is the static browser frontend for VCPGroupChat.

It is served by Nginx in the product Docker Compose setup and talks to the
business backend through `window.loadedConfig.BackendUrl` in `config_backend.js`.

## Local Run

```bash
python3 -m http.server 4090
```

Open:

```text
http://127.0.0.1:4090
```

The default backend URL is:

```text
http://127.0.0.1:7010
```

## Tests

Lightweight tests can be run from the product root:

```bash
npm run frontend:test:i18n
```

Some smoke tests require a running frontend and backend.

## Notes

This app is no longer configured through the old standalone `config_default.js`
and `script.js` flow. Product runtime data comes from GroupChatBackend APIs.
