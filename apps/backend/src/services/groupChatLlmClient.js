class GroupChatLlmClient {
    constructor(options = {}) {
        this.fetchImpl = options.fetchImpl || fetch;
        this.baseUrl = (options.baseUrl || process.env.GROUPCHAT_LLM_BASE_URL || '').replace(/\/$/, '');
        this.apiKey = options.apiKey || process.env.GROUPCHAT_LLM_API_KEY || '';
        this.provider = options.provider || process.env.GROUPCHAT_LLM_PROVIDER || '';
    }

    hasBackendProvider() {
        return Boolean(this.baseUrl);
    }

    assertBackendProviderConfigured() {
        if (this.hasBackendProvider()) {
            return;
        }
        const err = new Error(
            'GROUPCHAT_LLM_BASE_URL is required for VCPGroupChat backend model calls. '
            + 'VCP core configuration is separate and is not used as a model fallback.'
        );
        err.status = 500;
        throw err;
    }

    getRuntimeConfig() {
        return {
            mode: this.hasBackendProvider() ? 'backend' : 'unconfigured',
            provider: this.provider || '',
            base_url_configured: this.hasBackendProvider(),
            api_key_configured: Boolean(this.apiKey)
        };
    }

    buildHeaders(extraHeaders = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...extraHeaders
        };

        if (this.apiKey) {
            headers.Authorization = `Bearer ${this.apiKey}`;
        }

        return headers;
    }

    async request(pathname, options = {}) {
        const response = await this.fetchImpl(`${this.baseUrl}${pathname}`, {
            method: options.method || 'GET',
            headers: this.buildHeaders(options.headers),
            body: options.body ? JSON.stringify(options.body) : undefined
        });

        const text = await response.text();
        let data = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch (error) {
            data = { raw: text };
        }

        if (!response.ok) {
            const message = data?.error || data?.message || response.statusText;
            const err = new Error(message);
            err.status = response.status;
            err.payload = data;
            throw err;
        }

        return data;
    }

    async chatCompletions(payload) {
        this.assertBackendProviderConfigured();

        return this.request('/chat/completions', {
            method: 'POST',
            body: payload
        });
    }

    async *chatCompletionsStream(payload) {
        this.assertBackendProviderConfigured();

        const response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: this.buildHeaders({ Accept: 'text/event-stream' }),
            body: JSON.stringify({
                ...(payload || {}),
                stream: true
            })
        });

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            let data = null;
            try {
                data = text ? JSON.parse(text) : null;
            } catch (error) {
                data = { raw: text };
            }
            const message = data?.error || data?.message || response.statusText;
            const err = new Error(message);
            err.status = response.status;
            err.payload = data;
            throw err;
        }

        if (!response.body) {
            throw new Error('GroupChat LLM stream response body is empty');
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
                const chunk = this.parseSseBlock(part);
                if (chunk) {
                    yield chunk;
                }
            }
        }

        const trailing = buffer.trim();
        if (trailing) {
            const chunk = this.parseSseBlock(trailing);
            if (chunk) {
                yield chunk;
            }
        }
    }

    parseSseBlock(block) {
        const lines = String(block || '').split(/\r?\n/);
        const dataLines = [];
        for (const line of lines) {
            if (line.startsWith('data:')) {
                dataLines.push(line.slice(5).trimStart());
            }
        }

        if (!dataLines.length) {
            return null;
        }

        const raw = dataLines.join('\n').trim();
        if (!raw || raw === '[DONE]') {
            return { done: true };
        }

        let parsed = null;
        try {
            parsed = JSON.parse(raw);
        } catch (error) {
            return { delta: raw };
        }

        const delta = parsed?.choices?.[0]?.delta?.content
            ?? parsed?.choices?.[0]?.message?.content
            ?? '';
        return {
            raw: parsed,
            delta,
            done: parsed?.choices?.[0]?.finish_reason === 'stop'
        };
    }
}

module.exports = GroupChatLlmClient;
