#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import zlib from 'node:zlib';

export const ROLE_LIST_SUMMARY_CONTRACT = 'role-summary-v1';
export const HEAVY_ROLE_FIELDS = [
    'persona',
    'template_content',
    'role_spec',
    'collaboration_guide',
    'voice_style',
    'invite_prompt'
];

const DEFAULT_BOOTSTRAP_PAYLOAD_BUDGET_BYTES = 200_000;
const DEFAULT_ROLE_LIST_PAYLOAD_BUDGET_BYTES = 200_000;
const DEFAULT_ROLES_GZIP_BUDGET_BYTES = 12_000;
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

const scriptFile = fileURLToPath(import.meta.url);
const backendDir = dirname(dirname(scriptFile));
const appsDir = dirname(backendDir);
const projectRoot = dirname(appsDir);
const frontendTestsDir = join(appsDir, 'frontend', 'tests');

function normalizeBaseUrl(value, fallback) {
    return String(value || fallback).replace(/\/$/, '');
}

function getBudget(name, fallback) {
    const rawValue = process.env[name];
    if (rawValue === undefined || rawValue === '') {
        return fallback;
    }
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`${name} must be a positive byte budget, got ${rawValue}`);
    }
    return parsed;
}

export function getHeader(headers, name) {
    if (!headers || !name) {
        return '';
    }
    if (typeof headers.get === 'function') {
        return headers.get(name) || '';
    }

    const expected = String(name).toLowerCase();
    for (const [key, value] of Object.entries(headers)) {
        if (String(key).toLowerCase() !== expected) {
            continue;
        }
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        return value === undefined || value === null ? '' : String(value);
    }
    return '';
}

export function assertHeaderEquals(headers, name, expected, label) {
    const actual = getHeader(headers, name);
    if (actual !== expected) {
        throw new Error(`${label} expected ${name}: ${expected}, got ${actual || '<missing>'}`);
    }
    return actual;
}

export function assertBudgetAtMost(value, budget, label) {
    const measured = Number(value);
    const limit = Number(budget);
    if (!Number.isFinite(measured) || measured < 0) {
        throw new Error(`${label} must be a non-negative byte count, got ${value}`);
    }
    if (!Number.isFinite(limit) || limit <= 0) {
        throw new Error(`${label} budget must be positive, got ${budget}`);
    }
    if (measured > limit) {
        throw new Error(`${label} exceeds budget: ${measured} > ${limit}`);
    }
    return measured;
}

function roleLabel(role) {
    return role?.id || '<missing-id>';
}

export function assertRoleSummaryList(roles, label) {
    if (!Array.isArray(roles)) {
        throw new Error(`${label} must be an array`);
    }

    const heavyFields = [];
    const invalidFields = [];

    for (const role of roles) {
        if (!role || typeof role !== 'object') {
            invalidFields.push('<role:not-object>');
            continue;
        }

        const labelForRole = roleLabel(role);
        for (const field of HEAVY_ROLE_FIELDS) {
            if (Object.prototype.hasOwnProperty.call(role, field)) {
                heavyFields.push(`${labelForRole}.${field}`);
            }
        }
        if (!String(role.id || '').trim()) {
            invalidFields.push(`${labelForRole}.id`);
        }
        if (!String(role.name || '').trim()) {
            invalidFields.push(`${labelForRole}.name`);
        }
        if (role.details_loaded !== false) {
            invalidFields.push(`${labelForRole}.details_loaded`);
        }
    }

    if (heavyFields.length > 0) {
        throw new Error(`${label} contains heavy role fields: ${heavyFields.join(', ')}`);
    }
    if (invalidFields.length > 0) {
        throw new Error(`${label} contains invalid role summaries: ${invalidFields.join(', ')}`);
    }

    return roles;
}

export function assertRoleListPayload(payload, label) {
    if (!payload || typeof payload !== 'object') {
        throw new Error(`${label} must be a JSON object`);
    }
    return assertRoleSummaryList(payload.roles, `${label}.roles`);
}

export function requestRaw(url, options = {}) {
    const target = new URL(url);
    const transport = target.protocol === 'https:' ? https : http;
    const timeoutMs = Number(options.timeoutMs || DEFAULT_REQUEST_TIMEOUT_MS);

    return new Promise((resolveRequest, rejectRequest) => {
        const request = transport.request(target, {
            method: options.method || 'GET',
            headers: options.headers || {}
        }, response => {
            const chunks = [];
            response.on('data', chunk => {
                chunks.push(Buffer.from(chunk));
            });
            response.on('end', () => {
                resolveRequest({
                    url: target.toString(),
                    statusCode: response.statusCode,
                    headers: response.headers,
                    body: Buffer.concat(chunks)
                });
            });
        });

        request.setTimeout(timeoutMs, () => {
            request.destroy(new Error(`${target.toString()} timed out after ${timeoutMs}ms`));
        });
        request.on('error', rejectRequest);
        request.end(options.body || undefined);
    });
}

function assertStatus(response, expectedStatus, label) {
    if (response.statusCode !== expectedStatus) {
        const snippet = response.body.toString('utf8').slice(0, 300);
        throw new Error(`${label} expected status ${expectedStatus}, got ${response.statusCode}: ${snippet}`);
    }
}

function decodeJsonBody(response, label) {
    const encoding = getHeader(response.headers, 'Content-Encoding');
    const body = /\bgzip\b/i.test(encoding)
        ? zlib.gunzipSync(response.body)
        : response.body;
    try {
        return JSON.parse(body.toString('utf8'));
    } catch (error) {
        throw new Error(`${label} returned non-JSON body: ${body.toString('utf8').slice(0, 300)}`);
    }
}

function getHeaderByteCount(headers, name, label) {
    const rawValue = getHeader(headers, name);
    if (!rawValue) {
        throw new Error(`${label} missing ${name}`);
    }
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error(`${label} has invalid ${name}: ${rawValue}`);
    }
    return parsed;
}

async function checkBackendSessions(baseUrl) {
    const label = '/api/group-chat/sessions';
    const response = await requestRaw(`${baseUrl}${label}`);
    assertStatus(response, 200, label);
    const payload = decodeJsonBody(response, label);
    if (!Array.isArray(payload.sessions)) {
        throw new Error(`${label} expected sessions array`);
    }
    console.log(`[smoke] ${label}: ${payload.sessions.length} sessions visible`);
}

async function checkFrontend(frontendUrl) {
    const response = await requestRaw(`${frontendUrl}/`);
    assertStatus(response, 200, 'VCPGroupChat frontend /');
    if (response.body.length === 0) {
        throw new Error('VCPGroupChat frontend / returned an empty body');
    }
    console.log(`[smoke] frontend /: ${response.body.length} bytes`);
}

async function checkBootstrapPayload(baseUrl, budgetBytes) {
    const label = '/api/bootstrap';
    const response = await requestRaw(`${baseUrl}${label}`);
    assertStatus(response, 200, label);
    assertHeaderEquals(
        response.headers,
        'X-GroupChat-Role-Summary-Contract',
        ROLE_LIST_SUMMARY_CONTRACT,
        label
    );

    const payloadBytes = getHeaderByteCount(response.headers, 'X-GroupChat-Payload-Bytes', label);
    assertBudgetAtMost(payloadBytes, budgetBytes, `${label} payload bytes`);
    assertBudgetAtMost(response.body.length, budgetBytes, `${label} response bytes`);

    const payload = decodeJsonBody(response, label);
    assertRoleListPayload(payload, label);
    console.log(`[smoke] ${label}: ${payloadBytes} payload bytes`);
}

async function checkRolesGzipPayload(baseUrl, payloadBudgetBytes, gzipBudgetBytes) {
    const label = '/api/roles';
    const response = await requestRaw(`${baseUrl}${label}`, {
        headers: {
            'Accept-Encoding': 'gzip'
        }
    });
    assertStatus(response, 200, label);
    assertHeaderEquals(
        response.headers,
        'X-GroupChat-Role-Summary-Contract',
        ROLE_LIST_SUMMARY_CONTRACT,
        label
    );
    assertHeaderEquals(response.headers, 'Content-Encoding', 'gzip', label);

    const payloadBytes = getHeaderByteCount(response.headers, 'X-GroupChat-Payload-Bytes', label);
    assertBudgetAtMost(payloadBytes, payloadBudgetBytes, `${label} payload bytes`);
    assertBudgetAtMost(response.body.length, gzipBudgetBytes, `${label} gzip bytes`);

    const contentLength = getHeader(response.headers, 'Content-Length');
    if (contentLength) {
        assertBudgetAtMost(Number(contentLength), gzipBudgetBytes, `${label} Content-Length`);
    }

    const payload = decodeJsonBody(response, label);
    assertRoleListPayload(payload, label);
    console.log(`[smoke] ${label}: ${payloadBytes} payload bytes, ${response.body.length} gzip bytes`);
}

function runCommand(command, args, options = {}) {
    const label = options.label || [command, ...args].join(' ');
    return new Promise((resolveCommand, rejectCommand) => {
        const child = spawn(command, args, {
            cwd: options.cwd || process.cwd(),
            env: process.env,
            stdio: 'inherit'
        });
        child.on('error', rejectCommand);
        child.on('close', code => {
            if (code === 0) {
                resolveCommand();
                return;
            }
            rejectCommand(new Error(`${label} failed with exit code ${code}`));
        });
    });
}

async function runBackendContainerTests() {
    console.log('[smoke] running VCPGroupChat app container tests');
    await runCommand('npm', ['run', 'test:container'], {
        cwd: backendDir,
        label: 'VCPGroupChat app container tests'
    });
}

async function runFrontendSmokeTests() {
    const entries = await readdir(frontendTestsDir, { withFileTypes: true });
    const testFiles = entries
        .filter(entry => entry.isFile() && entry.name.endsWith('.mjs'))
        .map(entry => join(frontendTestsDir, entry.name))
        .sort();

    for (const testFile of testFiles) {
        console.log(`[smoke] running ${testFile.replace(`${projectRoot}/`, '')}`);
        await runCommand(process.execPath, [testFile], {
            cwd: projectRoot,
            label: testFile
        });
    }
}

async function runLiveApiSmoke(options) {
    await checkBackendSessions(options.backendUrl);
    await checkBootstrapPayload(options.backendUrl, options.bootstrapBudgetBytes);
    await checkRolesGzipPayload(
        options.backendUrl,
        options.roleListPayloadBudgetBytes,
        options.rolesGzipBudgetBytes
    );
    await checkFrontend(options.frontendUrl);
}

export async function runContinuousSmoke() {
    const options = {
        backendUrl: normalizeBaseUrl(process.env.GROUPCHAT_BACKEND_URL, 'http://127.0.0.1:7010'),
        frontendUrl: normalizeBaseUrl(process.env.GROUPCHAT_FRONTEND_URL, 'http://127.0.0.1:7010'),
        bootstrapBudgetBytes: getBudget(
            'GROUPCHAT_BOOTSTRAP_BUDGET_BYTES',
            DEFAULT_BOOTSTRAP_PAYLOAD_BUDGET_BYTES
        ),
        roleListPayloadBudgetBytes: getBudget(
            'GROUPCHAT_ROLE_LIST_PAYLOAD_BUDGET_BYTES',
            DEFAULT_ROLE_LIST_PAYLOAD_BUDGET_BYTES
        ),
        rolesGzipBudgetBytes: getBudget(
            'GROUPCHAT_ROLES_GZIP_BUDGET_BYTES',
            DEFAULT_ROLES_GZIP_BUDGET_BYTES
        )
    };

    await runBackendContainerTests();
    await runLiveApiSmoke(options);
    await runFrontendSmokeTests();
    console.log('[smoke] continuous VCPGroupChat smoke passed');
}

const isCli = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isCli) {
    runContinuousSmoke().catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
}
