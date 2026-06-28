import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = relativePath => readFileSync(join(repoRoot, relativePath), 'utf8');

const indexHtml = read('index.html');

for (const id of [
    'cognitive-inspector-synthesis-summary',
    'cognitive-inspector-participant-states',
    'cognitive-inspector-memory-deposition',
    'cognitive-inspector-project-assets'
]) {
    assert.match(indexHtml, new RegExp(`id="${id}"`), `cognitive inspector exposes ${id}`);
}
assert.match(indexHtml, /群聊状态与沉淀/, 'panel title keeps group-chat state and memory deposition together');

const domBindings = read('js/core/dom-binding-getters-role.js');
for (const binding of [
    'cognitiveInspectorSynthesisSummary',
    'cognitiveInspectorParticipantStates',
    'cognitiveInspectorMemoryDeposition',
    'cognitiveInspectorProjectAssets'
]) {
    assert.match(domBindings, new RegExp(`${binding}: byId\\(`), `DOM bindings include ${binding}`);
}

const reloadSource = read('js/core/session-manager-reload.js');
assert.match(reloadSource, /round_syntheses/, 'session reload preserves backend round syntheses');
assert.match(
    reloadSource,
    /setActiveSession\(\{\s*\.\.\.sessionData\.session,/s,
    'session reload merges synthesis payload into the active session'
);

const rendererSource = read('js/core/cognitive-inspector-renderer.js');
assert.match(rendererSource, /function renderRoundSynthesisPanel\b/, 'cognitive inspector renders round synthesis panel');
assert.match(rendererSource, /conversation_policy/, 'renderer shows ordinary/project conversation policy');
assert.match(rendererSource, /participant_states/, 'renderer shows per-role participant states');
assert.match(rendererSource, /memory_items/, 'renderer shows memory deposition items');
assert.match(rendererSource, /decisions/, 'renderer treats project assets as optional synthesis layer');
assert.match(rendererSource, /projectAssetsAction = 'confirm'/, 'project assets render an explicit confirm action');
assert.match(rendererSource, /project_assets\.confirmed/, 'project assets render confirmed state separately from task candidates');
assert.match(rendererSource, /project-assets:hcc:create/, 'project assets panel shows the host-side hcc create script');
assert.match(rendererSource, /--synthesis/, 'project assets panel includes the hcc synthesis argument');
assert.match(rendererSource, /renderRoundSynthesisPanel\({\s*dom,/s, 'main inspector render calls synthesis panel');

const memoryActionsSource = read('js/core/memory-reflection-actions.js');
assert.match(
    memoryActionsSource,
    /\/project-assets\/hcc\/confirm/,
    'frontend action calls the project asset confirmation endpoint'
);
assert.match(memoryActionsSource, /confirmProjectAssets/, 'frontend exposes confirmProjectAssets action');

const eventBindingSource = read('js/core/ui-event-bindings-memory-reflection.js');
assert.match(
    eventBindingSource,
    /data-project-assets-action/,
    'event binding delegates clicks from project asset action buttons'
);
assert.match(eventBindingSource, /confirmProjectAssets/, 'event binding calls confirmProjectAssets');

const bridgeSource = read('js/core/app-runtime-bridge-interaction-ui-session-ui.js');
assert.match(bridgeSource, /confirmProjectAssets/, 'runtime bridge exposes confirmProjectAssets');

const depKeysSource = read('js/core/app-modular-dep-keys-main-ui.js');
assert.match(depKeysSource, /confirmProjectAssets/, 'main UI dependency keys include confirmProjectAssets');

const summarySource = read('js/core/round-role-selection-summary.js');
assert.match(summarySource, /activeSession:/, 'role selection summary passes active session into cognitive inspector');

const cssSource = read('css/frontend-polish.css');
for (const className of [
    '.cognitive-synthesis-panel',
    '.cognitive-synthesis-grid',
    '.cognitive-synthesis-list',
    '.cognitive-synthesis-empty',
    '.cognitive-synthesis-project-actions',
    '.cognitive-synthesis-command'
]) {
    assert.match(cssSource, new RegExp(className.replace('.', '\\.')), `styles include ${className}`);
}

console.log('round synthesis panel smoke checks passed');
