import assert from 'node:assert/strict';

import { buildRoleDraftFromIdea } from '../js/core/role-draft-idea.js';
import { normalizeRoleDraft } from '../js/core/role-draft-normalization.js';
import {
    describeRoleDraftGeneration,
    normalizeRoleDraftMeta
} from '../js/core/role-draft-meta.js';
import { generateRoleDraftFromIdea } from '../js/core/role-draft-request.js';
import { buildRoleDraftStatusState } from '../js/core/role-draft-status.js';
import { translateUiText } from '../js/core/i18n.js';

const idea = '帮我创建一个既懂产品又懂代码的角色';
const modelConfigError = new Error(
    'GROUPCHAT_LLM_BASE_URL is required for VCPGroupChat backend model calls. '
    + 'VCP core configuration is separate and is not used as a model fallback.'
);

const originalConsoleError = console.error;
console.error = () => {};
let generated;
try {
    generated = await generateRoleDraftFromIdea({
        idea,
        getConfig: () => ({ ApiTimeout: 120 }),
        getActiveSession: () => ({ id: 'session-test' }),
        getManagedProfileId: () => 'profile-test',
        getSelectedRoleStudioModel: () => '',
        getSelectedRoleStudioEngine: () => 'hybrid',
        getSelectedRoleStudioReferenceIds: () => new Set(),
        fetchJson: async () => {
            throw modelConfigError;
        },
        applyRuntimeModelPreferenceToDraft: draft => draft,
        normalizeRoleDraft,
        normalizeRoleDraftMeta,
        buildRoleDraftFromIdea
    });
} finally {
    console.error = originalConsoleError;
}

assert.equal(generated.usedFallback, true);
assert.equal(generated.draft.name, '产品技术统筹');
assert.equal(generated.draftMeta?.fallbackReason, 'llm_backend_unconfigured');
assert.match(generated.draftMeta?.fallbackMessage || '', /GROUPCHAT_LLM_BASE_URL/);

const status = buildRoleDraftStatusState({
    draft: generated.draft,
    draftMeta: generated.draftMeta,
    usedFallback: generated.usedFallback,
    describeRoleDraftGeneration
});

assert.match(status.text, /后端模型接口未配置/);
assert.match(status.text, /GROUPCHAT_LLM_BASE_URL/);
assert.match(status.text, /产品技术统筹/);
assert.doesNotMatch(status.text, /检查后可继续创建/);

const translatedStatus = translateUiText(status.text, 'en');
assert.match(translatedStatus, /Backend model endpoint is not configured/);
assert.match(translatedStatus, /GROUPCHAT_LLM_BASE_URL/);
assert.match(translatedStatus, /产品技术统筹/);
assert.doesNotMatch(translatedStatus, /后端模型接口未配置/);

console.log('role-studio fallback status checks passed');
