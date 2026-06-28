const assert = require('assert');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

function listen(server, host = '127.0.0.1') {
    return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, host, () => {
            server.off('error', reject);
            resolve(server.address().port);
        });
    });
}

async function getFreePort() {
    const server = http.createServer();
    const port = await listen(server);
    await closeServer(server);
    return port;
}

function closeServer(server) {
    return new Promise(resolve => server.close(resolve));
}

function waitForBackendReady(child, timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
        let output = '';
        const timer = setTimeout(() => {
            reject(new Error(`backend did not start in time: ${output}`));
        }, timeoutMs);

        child.stdout.on('data', chunk => {
            output += chunk.toString();
            if (/GroupChatBackend listening on port/.test(output)) {
                clearTimeout(timer);
                resolve(output);
            }
        });
        child.stderr.on('data', chunk => {
            output += chunk.toString();
        });
        child.once('exit', code => {
            clearTimeout(timer);
            reject(new Error(`backend exited before ready with code ${code}: ${output}`));
        });
    });
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${text}`);
    }
    return data;
}

function createFakeCoreServer() {
    const importedRoles = [];

    const server = http.createServer((req, res) => {
        if (req.method === 'GET' && req.url === '/api/core/roles') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ roles: importedRoles }));
            return;
        }

        if (req.method === 'POST' && req.url === '/api/core/roles/import') {
            let raw = '';
            req.on('data', chunk => {
                raw += chunk;
            });
            req.on('end', () => {
                const payload = raw ? JSON.parse(raw) : {};
                const role = {
                    id: payload.id || 'runtime_http_person',
                    name: payload.name,
                    source: payload.source,
                    memory: payload.memory,
                    template_content: payload.template_content
                };
                importedRoles.push(role);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ role }));
            });
            return;
        }

        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'not found' }));
    });

    return { server, importedRoles };
}

async function testHttpRouteGeneratesRuntimeRoleAndUpdatesPerson() {
    const backendRoot = path.resolve(__dirname, '..');
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'groupchat-person-runtime-'));
    const dbPath = path.join(tempDir, 'groupchat-smoke.db');
    const { server: fakeCore, importedRoles } = createFakeCoreServer();
    let backend = null;

    try {
        const fakeCorePort = await listen(fakeCore);
        const backendPort = await getFreePort();
        backend = spawn(process.execPath, ['src/server.js'], {
            cwd: backendRoot,
            env: {
                ...process.env,
                PORT: String(backendPort),
                GROUPCHAT_DB_PATH: dbPath,
                VCP_CORE_URL: `http://127.0.0.1:${fakeCorePort}`
            },
            stdio: ['ignore', 'pipe', 'pipe']
        });

        const readyOutput = await waitForBackendReady(backend);
        const backendPortMatch = readyOutput.match(/GroupChatBackend listening on port (\d+)/);
        assert.ok(backendPortMatch, 'backend announces its port');
        assert.strictEqual(Number(backendPortMatch[1]), backendPort);
        const baseUrl = `http://127.0.0.1:${backendPort}`;

        const templateResponse = await fetchJson(`${baseUrl}/api/role-templates`, {
            method: 'POST',
            body: JSON.stringify({
                id: 'tpl_http_ai_engineer',
                source: 'agency-agents',
                external_id: 'engineering/ai-engineer',
                name: 'AI Engineer',
                template_content: '# AI Engineer\nBuilds AI systems.'
            })
        });
        const personResponse = await fetchJson(`${baseUrl}/api/persons/from-template`, {
            method: 'POST',
            body: JSON.stringify({
                template_id: templateResponse.template.id,
                id: 'person_http_ada',
                display_name: 'HTTP Ada',
                memory: { privateNotebook: 'HTTPAdaNotes' }
            })
        });
        assert.strictEqual(personResponse.person.legacy_role_id, null);

        const generateResponse = await fetchJson(
            `${baseUrl}/api/persons/${encodeURIComponent(personResponse.person.id)}/runtime-role/generate`,
            {
                method: 'POST',
                body: JSON.stringify({ id: 'runtime_http_ada', temperature: 0.25 })
            }
        );

        assert.strictEqual(generateResponse.runtime_role.id, 'runtime_http_ada');
        assert.strictEqual(generateResponse.person.legacy_role_id, 'runtime_http_ada');
        assert.strictEqual(importedRoles.length, 1);
        assert.strictEqual(importedRoles[0].name, 'HTTP Ada');
        assert.strictEqual(importedRoles[0].source, 'groupchat_person');
        assert.strictEqual(importedRoles[0].memory.owner_type, 'person');
        assert.strictEqual(importedRoles[0].memory.owner_id, 'person_http_ada');
        assert.match(importedRoles[0].template_content, /人物私有记忆入口：\{\{HTTPAdaNotes\}\}/);

        const personsAfterGenerate = await fetchJson(`${baseUrl}/api/persons`);
        const updatedPerson = personsAfterGenerate.persons.find(item => item.id === 'person_http_ada');
        assert.strictEqual(updatedPerson.legacy_role_id, 'runtime_http_ada');
    } finally {
        if (backend) {
            backend.kill('SIGTERM');
        }
        await closeServer(fakeCore);
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}

testHttpRouteGeneratesRuntimeRoleAndUpdatesPerson()
    .then(() => {
        console.log('personRuntimeRoleGenerationHttpSmoke.test.js checks passed');
    })
    .catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
