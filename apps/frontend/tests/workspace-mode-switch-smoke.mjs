import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = relativePath => readFileSync(join(repoRoot, relativePath), 'utf8');

const indexHtml = read('index.html');
const modeToggleMatches = [...indexHtml.matchAll(/data-workspace-mode-toggle="([^"]+)"/g)]
    .map(match => match[1]);

assert.deepEqual(
    modeToggleMatches.sort(),
    ['launcher', 'library', 'studio', 'team'].sort(),
    'role manager exposes in-modal workspace mode switches for every workspace mode'
);
assert.match(indexHtml, /class="workspace-mode-switcher"/, 'mode switches are grouped in the role manager header');

const shellBindings = read('js/core/ui-event-bindings-shell.js');
assert.match(shellBindings, /data-workspace-mode-toggle/, 'shell event bindings delegate in-modal workspace mode clicks');
assert.match(shellBindings, /openWorkspace\(mode\)/, 'in-modal workspace mode clicks call openWorkspace(mode)');

const modeRenderer = read('js/ui/workspace-renderers-mode.js');
assert.match(modeRenderer, /querySelectorAll\('\[data-workspace-mode-toggle\]'\)/, 'mode renderer finds all in-modal mode buttons');
assert.match(modeRenderer, /workspace-toggle-active/, 'mode renderer syncs active class on in-modal mode buttons');
assert.match(modeRenderer, /aria-pressed/, 'mode renderer syncs pressed state for in-modal mode buttons');

console.log('workspace mode switch smoke checks passed');
