import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = relativePath => readFileSync(join(repoRoot, relativePath), 'utf8');

const rendererSource = read('js/ui/role-studio-renderer.js');

assert.match(
    rendererSource,
    /import\s+\{\s*translateUiText\s*\}\s+from\s+['"]\.\.\/core\/i18n\.js['"]/,
    'role-studio-renderer.js must import translateUiText before using it in renderRoleStudio'
);

const roleDraftMetaSource = read('js/core/role-draft-meta.js');

assert.match(
    roleDraftMetaSource,
    /import\s+\{\s*translateUiText\s*\}\s+from\s+['"]\.\/i18n\.js['"]/,
    'role-draft-meta.js must import translateUiText before building translated draft meta labels'
);

console.log('role-studio renderer import checks passed');
