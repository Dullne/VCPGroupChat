import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const rendererSource = readFileSync(join(repoRoot, 'js/ui/role-studio-renderer.js'), 'utf8');

assert.match(
    rendererSource,
    /import\s+\{\s*translateUiText\s*\}\s+from\s+['"]\.\.\/core\/i18n\.js['"]/,
    'role-studio-renderer.js must import translateUiText before using it in renderRoleStudio'
);

console.log('role-studio renderer import checks passed');
