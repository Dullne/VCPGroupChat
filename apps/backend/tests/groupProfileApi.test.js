const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { buildGroupProfilePatchPayload } = require('../src/services/groupProfilePayload');

function testBuildsPartialPatchPayloadWithoutUndefinedFields() {
    const payload = buildGroupProfilePatchPayload({
        mode: 'natural-random',
        mode_options: {
            random_min_speakers: 1,
            random_max_speakers: 4
        }
    });

    assert.deepStrictEqual(payload, {
        mode: 'natural-random',
        mode_options: {
            random_min_speakers: 1,
            random_max_speakers: 4
        }
    });
    assert.ok(!Object.prototype.hasOwnProperty.call(payload, 'name'));
    assert.ok(!Object.prototype.hasOwnProperty.call(payload, 'group_prompt'));
}

function testKeepsExplicitSubmittedFieldsForFormPatchPayloads() {
    const payload = buildGroupProfilePatchPayload({
        team_id: 'team_default',
        name: 'Acceptance 96',
        description: '',
        mode: 'naturerandom',
        invite_prompt: '',
        mode_options: {
            mention_mode: 'ignore'
        },
        group_prompt: 'Updated prompt'
    });

    assert.deepStrictEqual(payload, {
        team_id: 'team_default',
        name: 'Acceptance 96',
        description: '',
        mode: 'naturerandom',
        invite_prompt: '',
        mode_options: {
            mention_mode: 'ignore'
        },
        group_prompt: 'Updated prompt'
    });
}

function testServerUsesPatchPayloadBuilder() {
    const serverSource = fs.readFileSync(
        path.join(__dirname, '../src/server.js'),
        'utf8'
    );

    assert.match(
        serverSource,
        /buildGroupProfilePatchPayload\(req\.body\)/,
        'PATCH /api/group-profiles/:id should only forward fields submitted by the client'
    );
}

testBuildsPartialPatchPayloadWithoutUndefinedFields();
testKeepsExplicitSubmittedFieldsForFormPatchPayloads();
testServerUsesPatchPayloadBuilder();
console.log('groupProfileApi.test.js route contract checks passed');
