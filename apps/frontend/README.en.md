# VCPGroupChat Frontend

**Language: [中文](README.md) | English**

This is the static browser frontend for VCPGroupChat.

In the default product Docker Compose stack, it is served same-origin by GroupChatBackend and no longer needs a separate Nginx frontend container. For standalone debugging, it still talks to the business backend through `window.loadedConfig.BackendUrl` in `config_backend.js`.

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

The default product stack opens directly at:

```text
http://127.0.0.1:7010
```

## Tests

Lightweight tests can be run from the product root:

```bash
npm run frontend:test:i18n
```

Some smoke tests require the product app to be running.

## Notes

This app is no longer configured through the old standalone `config_default.js` and `script.js` flow. Product runtime data comes from GroupChatBackend APIs.
