import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildRoleDraftFromIdea } from '../js/core/role-draft-idea.js';
import { normalizeRoleDraft } from '../js/core/role-draft-normalization.js';
import { normalizeRoleDraftMeta } from '../js/core/role-draft-meta.js';
import { generateRoleDraftFromIdea } from '../js/core/role-draft-request.js';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = relativePath => readFileSync(join(repoRoot, relativePath), 'utf8');

const idea = '创建一个负责产品和技术路线对齐的人物';
const draftResponse = {
    draft: {
        name: '路线对齐师',
        description: '负责产品和技术路线对齐',
        persona: '你是路线对齐师。',
        responsibilities: ['拆解目标', '识别技术风险', '形成路线建议'],
        template: '人物名称：路线对齐师\n人物定位：负责产品和技术路线对齐\n核心职责：\n- 拆解目标\n- 识别技术风险\n- 形成路线建议',
        privateNotebook: '路线对齐师',
        knowledgeNotebook: '路线对齐师的知识',
        invitePrompt: '请作为路线对齐师发言。',
        collaborationGuide: '先判断，再建议。',
        voiceStyle: '清晰',
        model: ''
    },
    meta: {
        source: 'llm',
        model: 'test/model'
    }
};

function createGenerationDeps(overrides = {}) {
    return {
        idea,
        getConfig: () => ({ ApiTimeout: 120 }),
        getActiveSession: () => ({ id: 'session-current' }),
        getManagedProfileId: () => 'profile-current',
        getSelectedRoleStudioContextMode: () => overrides.contextMode || 'none',
        getSelectedRoleStudioModel: () => '',
        getSelectedRoleStudioEngine: () => 'hybrid',
        getSelectedRoleStudioReferenceIds: () => new Set(),
        fetchJson: async (_path, options) => {
            overrides.onRequest?.(options.body);
            return draftResponse;
        },
        applyRuntimeModelPreferenceToDraft: draft => draft,
        normalizeRoleDraft,
        normalizeRoleDraftMeta,
        buildRoleDraftFromIdea
    };
}

let defaultPayload = null;
await generateRoleDraftFromIdea(createGenerationDeps({
    contextMode: 'none',
    onRequest: body => {
        defaultPayload = body;
    }
}));

assert.equal(defaultPayload.context_mode, 'none');
assert.equal(defaultPayload.session_id, null);
assert.equal(defaultPayload.profile_id, null);

let groupPayload = null;
await generateRoleDraftFromIdea(createGenerationDeps({
    contextMode: 'group_profile',
    onRequest: body => {
        groupPayload = body;
    }
}));

assert.equal(groupPayload.context_mode, 'group_profile');
assert.equal(groupPayload.session_id, 'session-current');
assert.equal(groupPayload.profile_id, 'profile-current');

const indexHtml = read('index.html');
assert.match(
    indexHtml,
    /id="role-studio-context-mode-select"/,
    'Person Studio should expose an explicit context mode selector'
);
assert.match(
    indexHtml,
    /Person Studio|人物工坊/,
    'Person Studio copy should be person-first'
);
assert.doesNotMatch(
    indexHtml,
    new RegExp(['角色', '工坊'].join('')),
    'Person Studio should not expose the old role-studio title'
);
assert.match(
    indexHtml,
    /<option value="none" selected>独立创建人物<\/option>/,
    'Person Studio should default to independent person creation'
);
assert.match(
    indexHtml,
    /<option value="group_profile">为当前群组补位<\/option>/,
    'Person Studio should offer an explicit group fill mode'
);

console.log('role-studio context mode checks passed');
