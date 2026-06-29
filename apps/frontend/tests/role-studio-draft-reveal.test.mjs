import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = relativePath => readFileSync(join(repoRoot, relativePath), 'utf8');

const indexHtml = read('index.html');
assert.match(
    indexHtml,
    /id="role-draft-preview"[^>]*tabindex="-1"/,
    'role draft preview should be programmatically focusable after generation'
);

const domBindingSource = read('js/core/dom-binding-getters-role.js');
assert.match(
    domBindingSource,
    /roleDraftPreview:\s*byId\(['"]role-draft-preview['"]\)/,
    'DOM bindings should expose the role draft preview element'
);

const actionSource = read('js/core/role-draft-idea-action.js');
assert.match(
    actionSource,
    /restoreRoleDraftUi\(\s*dom,\s*renderRoleStudio,\s*\{\s*revealDraftPreview:/,
    'role draft generation should ask the UI restore step to reveal the generated preview'
);

const uiSource = read('js/core/role-draft-action-ui.js');
assert.match(
    uiSource,
    /function\s+revealRoleDraftPreview/,
    'role draft action UI should expose a focused reveal helper for generated drafts'
);
assert.match(
    uiSource,
    /dom\.roleDraftPreview\s*\|\|\s*dom\.roleDraftContent/,
    'generated draft reveal should prefer the preview panel and fall back to the draft content'
);
assert.match(
    uiSource,
    /scrollIntoView/,
    'generated draft reveal should scroll the preview panel into view'
);
assert.match(
    uiSource,
    /behavior:\s*['"]smooth['"]/,
    'generated draft reveal should use smooth scrolling'
);
assert.match(
    uiSource,
    /block:\s*['"]start['"]/,
    'generated draft reveal should align the preview start with the viewport'
);

console.log('role-studio draft reveal checks passed');
