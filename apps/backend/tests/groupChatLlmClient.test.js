const assert = require('assert');

const GroupChatLlmClient = require('../src/services/groupChatLlmClient');

async function withEnv(overrides, fn) {
    const previous = {};
    for (const key of Object.keys(overrides)) {
        previous[key] = process.env[key];
        if (overrides[key] === undefined) {
            delete process.env[key];
        } else {
            process.env[key] = overrides[key];
        }
    }

    try {
        await fn();
    } finally {
        for (const [key, value] of Object.entries(previous)) {
            if (value === undefined) {
                delete process.env[key];
            } else {
                process.env[key] = value;
            }
        }
    }
}

async function testUsesBackendOwnedProviderForChatCompletions() {
    const calls = [];

    await withEnv({
        GROUPCHAT_LLM_BASE_URL: 'https://llm.example.test/v1',
        GROUPCHAT_LLM_API_KEY: 'tk',
        GROUPCHAT_LLM_PROVIDER: 'backend-openai-compatible'
    }, async () => {
        const client = new GroupChatLlmClient({
            fetchImpl: async (url, options = {}) => {
                calls.push({
                    url,
                    method: options.method,
                    authorization: options.headers?.Authorization,
                    body: JSON.parse(options.body)
                });
                return {
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    async text() {
                        return JSON.stringify({
                            id: 'chatcmpl_backend',
                            choices: [
                                {
                                    message: {
                                        content: 'backend provider response'
                                    }
                                }
                            ]
                        });
                    }
                };
            }
        });
        const completion = await client.chatCompletions({
            model: 'test/model',
            messages: [{ role: 'user', content: 'hello' }]
        });

        assert.strictEqual(completion.choices[0].message.content, 'backend provider response');
    });

    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].url, 'https://llm.example.test/v1/chat/completions');
    assert.strictEqual(calls[0].method, 'POST');
    assert.strictEqual(calls[0].authorization, 'Bearer tk');
    assert.strictEqual(calls[0].body.model, 'test/model');
}

async function testRequiresBackendProviderForModelCalls() {
    const apiKeyEnvName = 'GROUPCHAT_LLM_API_KEY';
    await withEnv({
        GROUPCHAT_LLM_BASE_URL: undefined,
        [apiKeyEnvName]: undefined,
        GROUPCHAT_LLM_PROVIDER: undefined
    }, async () => {
        const client = new GroupChatLlmClient();
        await assert.rejects(
            () => client.chatCompletions({
                model: 'core/model',
                messages: [{ role: 'user', content: 'hello' }]
            }),
            error => error.status === 500
                && /GROUPCHAT_LLM_BASE_URL/.test(error.message)
                && /VCP core/.test(error.message)
        );
    });
}

function testDoesNotProxyCoreBusinessApis() {
    const client = new GroupChatLlmClient({
        baseUrl: 'https://llm.example.test/v1',
        apiKey: 'tk'
    });

    assert.strictEqual(client.listRoles, undefined);
    assert.strictEqual(client.importRole, undefined);
    assert.strictEqual(client.getRole, undefined);
}

function testRuntimeConfigDoesNotExposeApiKey() {
    const client = new GroupChatLlmClient({
        baseUrl: 'https://llm.example.test/v1',
        apiKey: 'tk',
        provider: 'backend-openai-compatible'
    });

    assert.deepStrictEqual(client.getRuntimeConfig(), {
        mode: 'backend',
        provider: 'backend-openai-compatible',
        base_url_configured: true,
        api_key_configured: true
    });
}

async function run() {
    await testUsesBackendOwnedProviderForChatCompletions();
    await testRequiresBackendProviderForModelCalls();
    testDoesNotProxyCoreBusinessApis();
    testRuntimeConfigDoesNotExposeApiKey();
    console.log('groupChatLlmClient.test.js passed');
}

run().catch(error => {
    console.error(error);
    process.exit(1);
});
