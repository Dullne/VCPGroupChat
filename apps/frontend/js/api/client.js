export async function fetchJsonWithConfig(config, pathname, options = {}) {
    if (!config?.BackendUrl) {
        throw new Error('缺少后端配置 BackendUrl');
    }

    const response = await fetch(`${config.BackendUrl}${pathname}`, {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: AbortSignal.timeout((options.timeoutSeconds || config.ApiTimeout || 120) * 1000)
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
        throw new Error(data.error || response.statusText);
    }

    return data;
}
