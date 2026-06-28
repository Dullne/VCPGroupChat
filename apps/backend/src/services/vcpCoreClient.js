class VcpCoreClient {
    constructor(options = {}) {
        this.baseUrl = (options.baseUrl || process.env.VCP_CORE_URL || 'http://127.0.0.1:6005').replace(/\/$/, '');
        this.apiKey = options.apiKey || process.env.VCP_CORE_KEY || '';
    }

    async request(pathname, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (this.apiKey) {
            headers.Authorization = `Bearer ${this.apiKey}`;
        }

        const response = await fetch(`${this.baseUrl}${pathname}`, {
            method: options.method || 'GET',
            headers,
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

    async getHealth() {
        return this.request('/api/core/health');
    }

    async listRoles() {
        const data = await this.request('/api/core/roles');
        return Array.isArray(data?.roles) ? data.roles : [];
    }

    async getRole(roleId) {
        const data = await this.request(`/api/core/roles/${encodeURIComponent(roleId)}`);
        return data?.role || null;
    }

    async listImportSources() {
        const data = await this.request('/api/core/import-sources');
        return Array.isArray(data?.sources) ? data.sources : [];
    }

    async importFromSource(source, payload = {}) {
        return this.request(`/api/core/import-sources/${encodeURIComponent(source)}/import`, {
            method: 'POST',
            body: payload
        });
    }

    async roleTurn(payload) {
        return this.request('/api/core/role-turn', {
            method: 'POST',
            body: payload
        });
    }

    async writeMemoryCandidate(payload) {
        return this.request('/api/core/memory-candidates/write', {
            method: 'POST',
            body: payload
        });
    }

    async getMemoryCandidateIndexStatus(filePath) {
        const query = new URLSearchParams({ file_path: String(filePath || '') });
        return this.request(`/api/core/memory-candidates/index-status?${query.toString()}`);
    }

    async listIndexRequeueCandidates(options = {}) {
        const query = new URLSearchParams();
        for (const [key, value] of Object.entries(options)) {
            if (value === undefined || value === null || value === '') {
                continue;
            }
            query.set(key, Array.isArray(value) ? value.join(',') : String(value));
        }
        return this.request(`/api/core/memory-candidates/index-requeue-candidates?${query.toString()}`);
    }

    async requeueIndexBatch(payload = {}) {
        return this.request('/api/core/memory-candidates/index-requeue-batch', {
            method: 'POST',
            body: payload
        });
    }

    async importRole(payload) {
        const data = await this.request('/api/core/roles/import', {
            method: 'POST',
            body: payload
        });
        return data?.role || null;
    }
}

module.exports = VcpCoreClient;
