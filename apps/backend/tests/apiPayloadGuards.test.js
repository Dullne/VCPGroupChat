const assert = require('assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const {
    ROLE_LIST_SUMMARY_CONTRACT,
    assertRoleListSummaryContract,
    enforceJsonPayloadBudget,
    sendGuardedRoleListJson
} = require('../src/services/apiPayloadGuards');

function createFakeResponse() {
    const headers = {};
    return {
        headers,
        body: null,
        jsonPayload: null,
        statusCode: 200,
        setHeader(name, value) {
            headers[name.toLowerCase()] = value;
        },
        getHeader(name) {
            return headers[name.toLowerCase()];
        },
        json(payload) {
            this.jsonPayload = payload;
            this.body = Buffer.from(JSON.stringify(payload));
            return this;
        },
        send(payload) {
            this.body = Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload));
            return this;
        }
    };
}

function testRoleListSummaryContractRejectsHeavyFields() {
    assert.throws(
        () => assertRoleListSummaryContract([
            {
                id: 'role_a',
                name: 'Role A',
                details_loaded: false,
                role_spec: { persona: 'heavy detail' }
            }
        ], { label: '/api/bootstrap.roles' }),
        /\/api\/bootstrap\.roles contains heavy role fields: role_a\.role_spec/
    );
}

function testRoleListSummaryContractRejectsInvalidSummaryShape() {
    assert.throws(
        () => assertRoleListSummaryContract([
            {
                id: 'role_a',
                name: 'Role A',
                details_loaded: true
            },
            {
                id: '',
                name: 'Role B',
                details_loaded: false
            }
        ], { label: '/api/roles.roles' }),
        /\/api\/roles\.roles contains invalid role summaries: role_a\.details_loaded, <missing-id>\.id/
    );
}

function testJsonPayloadBudgetRejectsOversizedPayload() {
    assert.throws(
        () => enforceJsonPayloadBudget({
            roles: [{ id: 'role_a', description: 'x'.repeat(80) }]
        }, {
            label: '/api/bootstrap',
            budgetBytes: 64
        }),
        /\/api\/bootstrap payload exceeds budget/
    );
}

function testGuardedRoleListJsonSetsHeadersAndGzipsWhenAccepted() {
    const payload = {
        roles: [{
            id: 'role_a',
            name: 'Role A',
            description: 'summary '.repeat(40),
            details_loaded: false
        }]
    };
    const req = {
        headers: {
            'accept-encoding': 'br, gzip'
        }
    };
    const res = createFakeResponse();

    sendGuardedRoleListJson(req, res, payload, {
        label: '/api/roles',
        budgetBytes: 10_000,
        minGzipBytes: 32
    });

    assert.equal(res.getHeader('X-GroupChat-Role-Summary-Contract'), ROLE_LIST_SUMMARY_CONTRACT);
    assert.equal(res.getHeader('Content-Encoding'), 'gzip');
    assert.match(String(res.getHeader('Vary')), /Accept-Encoding/);
    assert.equal(Number(res.getHeader('X-GroupChat-Payload-Bytes')), Buffer.byteLength(JSON.stringify(payload)));
    assert.deepStrictEqual(JSON.parse(zlib.gunzipSync(res.body).toString('utf8')), payload);
    assert.equal(res.jsonPayload, null);
}

function testRoleListRoutesUseGuardedJsonSender() {
    const serverSource = fs.readFileSync(
        path.join(__dirname, '../src/server.js'),
        'utf8'
    );

    assert.match(
        serverSource,
        /sendGuardedRoleListJson/,
        'server imports and uses the guarded role-list JSON sender'
    );
    assert.match(
        serverSource,
        /sendGuardedRoleListJson\(req,\s*res,\s*bootstrapPayload/,
        '/api/bootstrap sends through the role-list payload guard'
    );
    assert.match(
        serverSource,
        /sendGuardedRoleListJson\(req,\s*res,\s*rolesPayload/,
        '/api/roles sends through the role-list payload guard'
    );
}

testRoleListSummaryContractRejectsHeavyFields();
testRoleListSummaryContractRejectsInvalidSummaryShape();
testJsonPayloadBudgetRejectsOversizedPayload();
testGuardedRoleListJsonSetsHeadersAndGzipsWhenAccepted();
testRoleListRoutesUseGuardedJsonSender();
console.log('apiPayloadGuards.test.js passed');
