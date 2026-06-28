// ========== API 请求工具 ==========
import { state } from '../core/state.js';

export function getBaseUrl() {
    return state.config?.BackendUrl || window.loadedConfig?.BackendUrl || 'http://127.0.0.1:7010';
}

function parseSseEventBlock(block) {
    const event = { type: 'message', data: '' };
    const dataLines = [];

    for (const line of String(block || '').split(/\r?\n/)) {
        if (!line || line.startsWith(':')) {
            continue;
        }
        const separatorIndex = line.indexOf(':');
        const field = separatorIndex >= 0 ? line.slice(0, separatorIndex) : line;
        const rawValue = separatorIndex >= 0 ? line.slice(separatorIndex + 1) : '';
        const value = rawValue.startsWith(' ') ? rawValue.slice(1) : rawValue;

        if (field === 'event') {
            event.type = value || 'message';
        } else if (field === 'data') {
            dataLines.push(value);
        }
    }

    event.data = dataLines.join('\n');
    return event;
}

export async function postJsonStream(path, body, { onEvent, signal, timeoutSeconds } = {}) {
    const url = path.startsWith('http') ? path : `${getBaseUrl()}${path}`;
    const controller = signal ? null : new AbortController();
    const requestSignal = signal || controller.signal;
    const timeout = Number(timeoutSeconds || state.config?.ApiTimeout || 120) * 1000;
    const timeoutId = controller ? setTimeout(() => controller.abort(), timeout) : null;

    try {
        const response = await fetch(url, {
            method: 'POST',
            signal: requestSignal,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'text/event-stream'
            },
            body: JSON.stringify(body || {})
        });

        if (!response.ok) {
            const errorBody = await response.text().catch(() => '');
            throw new Error(`HTTP ${response.status}: ${errorBody || response.statusText}`);
        }
        if (!response.body) {
            throw new Error('当前浏览器不支持流式响应');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                break;
            }

            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split(/\r?\n\r?\n/);
            buffer = parts.pop() || '';

            for (const part of parts) {
                const parsed = parseSseEventBlock(part);
                if (!parsed.data && parsed.type === 'message') {
                    continue;
                }
                let payload = parsed.data;
                try {
                    payload = parsed.data ? JSON.parse(parsed.data) : null;
                } catch (error) {
                    payload = parsed.data;
                }
                onEvent?.({ type: parsed.type, payload });
            }
        }

        const trailing = buffer.trim();
        if (trailing) {
            const parsed = parseSseEventBlock(trailing);
            let payload = parsed.data;
            try {
                payload = parsed.data ? JSON.parse(parsed.data) : null;
            } catch (error) {
                payload = parsed.data;
            }
            onEvent?.({ type: parsed.type, payload });
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('请求超时');
        }
        throw error;
    } finally {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }
}

export async function fetchJson(path, options = {}) {
    const url = path.startsWith('http') ? path : `${getBaseUrl()}${path}`;
    const controller = new AbortController();
    const timeout = Number(options.timeoutSeconds || state.config?.ApiTimeout || 120) * 1000;
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const { timeoutSeconds, ...fetchOptions } = options;

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...fetchOptions.headers
            }
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            const errorBody = await response.text().catch(() => '');
            throw new Error(`HTTP ${response.status}: ${errorBody || response.statusText}`);
        }
        return response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') throw new Error('请求超时');
        throw error;
    }
}

export async function postJson(url, data) {
    return fetchJson(url, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function deleteJson(url) {
    return fetchJson(url, { method: 'DELETE' });
}
