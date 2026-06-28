const zlib = require('zlib');
const { createHttpError } = require('./httpError');

const ROLE_LIST_SUMMARY_CONTRACT = 'role-summary-v1';
const DEFAULT_ROLE_LIST_PAYLOAD_BUDGET_BYTES = 200_000;
const DEFAULT_GZIP_MIN_BYTES = 1024;
const HEAVY_ROLE_FIELDS = [
    'persona',
    'template_content',
    'role_spec',
    'collaboration_guide',
    'voice_style',
    'invite_prompt'
];

function measureJsonPayloadBytes(payload) {
    return Buffer.byteLength(JSON.stringify(payload));
}

function findHeavyRoleFields(roles = []) {
    if (!Array.isArray(roles)) {
        return ['<roles:not-array>'];
    }

    const findings = [];
    for (const role of roles) {
        if (!role || typeof role !== 'object') {
            continue;
        }
        for (const field of HEAVY_ROLE_FIELDS) {
            if (Object.prototype.hasOwnProperty.call(role, field)) {
                findings.push(`${role.id || '<unknown>'}.${field}`);
            }
        }
    }
    return findings;
}

function getRoleLabel(role) {
    return role?.id || '<missing-id>';
}

function findInvalidRoleSummaryFields(roles = []) {
    if (!Array.isArray(roles)) {
        return ['<roles:not-array>'];
    }

    const findings = [];
    for (const role of roles) {
        if (!role || typeof role !== 'object') {
            findings.push('<role:not-object>');
            continue;
        }
        const label = getRoleLabel(role);
        if (!String(role.id || '').trim()) {
            findings.push(`${label}.id`);
        }
        if (!String(role.name || '').trim()) {
            findings.push(`${label}.name`);
        }
        if (role.details_loaded !== false) {
            findings.push(`${label}.details_loaded`);
        }
    }
    return findings;
}

function assertRoleListSummaryContract(roles = [], options = {}) {
    const label = options.label || 'roles';
    const findings = findHeavyRoleFields(roles);
    if (findings.length > 0) {
        throw createHttpError(
            500,
            `${label} contains heavy role fields: ${findings.join(', ')}`,
            { fields: findings }
        );
    }
    const invalidFields = findInvalidRoleSummaryFields(roles);
    if (invalidFields.length > 0) {
        throw createHttpError(
            500,
            `${label} contains invalid role summaries: ${invalidFields.join(', ')}`,
            { fields: invalidFields }
        );
    }
    return roles;
}

function enforceJsonPayloadBudget(payload, options = {}) {
    const label = options.label || 'json payload';
    const budgetBytes = Number(options.budgetBytes || DEFAULT_ROLE_LIST_PAYLOAD_BUDGET_BYTES);
    const payloadBytes = measureJsonPayloadBytes(payload);
    if (Number.isFinite(budgetBytes) && budgetBytes > 0 && payloadBytes > budgetBytes) {
        throw createHttpError(
            500,
            `${label} payload exceeds budget: ${payloadBytes} > ${budgetBytes} bytes`,
            { payload_bytes: payloadBytes, budget_bytes: budgetBytes }
        );
    }
    return payloadBytes;
}

function acceptsGzip(req = {}) {
    return /\bgzip\b/i.test(String(req.headers?.['accept-encoding'] || ''));
}

function appendVaryHeader(res, value) {
    const current = String(res.getHeader?.('Vary') || '').trim();
    if (!current) {
        res.setHeader('Vary', value);
        return;
    }
    const values = current.split(',').map(item => item.trim().toLowerCase());
    if (!values.includes(value.toLowerCase())) {
        res.setHeader('Vary', `${current}, ${value}`);
    }
}

function sendJsonWithOptionalGzip(req, res, payload, options = {}) {
    const minGzipBytes = Number(options.minGzipBytes || DEFAULT_GZIP_MIN_BYTES);
    const json = JSON.stringify(payload);
    const payloadBytes = Buffer.byteLength(json);

    res.setHeader('X-GroupChat-Payload-Bytes', String(payloadBytes));

    if (
        acceptsGzip(req)
        && Number.isFinite(minGzipBytes)
        && payloadBytes >= minGzipBytes
        && !res.getHeader('Content-Encoding')
    ) {
        const compressed = zlib.gzipSync(Buffer.from(json));
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Length', String(compressed.length));
        appendVaryHeader(res, 'Accept-Encoding');
        return res.send(compressed);
    }

    return res.json(payload);
}

function sendGuardedRoleListJson(req, res, payload, options = {}) {
    const label = options.label || 'role list';
    const roles = Array.isArray(payload?.roles) ? payload.roles : [];

    assertRoleListSummaryContract(roles, { label: `${label}.roles` });
    enforceJsonPayloadBudget(payload, {
        label,
        budgetBytes: options.budgetBytes || process.env.GROUPCHAT_ROLE_LIST_PAYLOAD_BUDGET_BYTES
    });

    res.setHeader('X-GroupChat-Role-Summary-Contract', ROLE_LIST_SUMMARY_CONTRACT);
    return sendJsonWithOptionalGzip(req, res, payload, options);
}

module.exports = {
    ROLE_LIST_SUMMARY_CONTRACT,
    DEFAULT_ROLE_LIST_PAYLOAD_BUDGET_BYTES,
    HEAVY_ROLE_FIELDS,
    measureJsonPayloadBytes,
    findHeavyRoleFields,
    findInvalidRoleSummaryFields,
    assertRoleListSummaryContract,
    enforceJsonPayloadBudget,
    sendJsonWithOptionalGzip,
    sendGuardedRoleListJson
};
