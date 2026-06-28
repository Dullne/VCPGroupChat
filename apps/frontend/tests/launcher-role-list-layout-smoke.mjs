import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = relativePath => readFileSync(join(repoRoot, relativePath), 'utf8');

const css = read('css/frontend-polish.css');
const match = css.match(/\.launcher-role-list\s*\{(?<body>[\s\S]*?)\n\}/);

assert.ok(match?.groups?.body, 'frontend polish defines launcher role list styles');

const block = match.groups.body;
const narrowMedia = css.match(/@media \(max-width: 1180px\) \{(?<body>[\s\S]*?)\n\}\n\n@media \(max-width: 860px\)/);
const mobileMedia = css.match(/@media \(max-width: 860px\) \{(?<body>[\s\S]*?)\n\}\n*$/);

assert.match(block, /max-height\s*:\s*min\(48svh,\s*520px\)\s*;/, 'launcher role list keeps a bounded height');
assert.match(block, /min-height\s*:\s*0\s*;/, 'launcher role list can shrink inside the workspace grid');
assert.match(block, /overflow-y\s*:\s*auto\s*;/, 'launcher role cards scroll inside the picker instead of overflowing into the confirm form');
assert.match(block, /overflow-x\s*:\s*hidden\s*;/, 'launcher role list prevents horizontal card spillover');

assert.ok(narrowMedia?.groups?.body, 'frontend polish defines 1180px narrow layout overrides');

const narrowBlock = narrowMedia.groups.body;

assert.match(narrowBlock, /\.workspace-mode-launcher \.launcher-role-list\s*\{[\s\S]*?max-height\s*:\s*none\s*;[\s\S]*?\}/, 'single-column launcher lets the modal page own vertical scrolling');
assert.match(narrowBlock, /\.workspace-mode-launcher \.launcher-role-list\s*\{[\s\S]*?overflow-y\s*:\s*visible\s*;[\s\S]*?\}/, 'single-column launcher avoids nested role-card scrolling');
assert.match(narrowBlock, /\.workspace-mode-launcher \.launcher-role-list\s*\{[\s\S]*?padding-right\s*:\s*0\s*;[\s\S]*?\}/, 'single-column launcher removes desktop scrollbar gutter padding');

assert.ok(mobileMedia?.groups?.body, 'frontend polish defines 860px mobile layout overrides');

const mobileBlock = mobileMedia.groups.body;

assert.match(mobileBlock, /\.workspace-mode-launcher \.workspace-flow-grid-secondary\s*\{[\s\S]*?grid-template-areas\s*:\s*"picker"\s*"create"\s*!important\s*;[\s\S]*?\}/, 'mobile launcher keeps picker before confirm form instead of clearing named grid areas');

console.log('launcher role list layout smoke checks passed');
