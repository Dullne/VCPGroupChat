import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = relativePath => readFileSync(join(repoRoot, relativePath), 'utf8');

const messageRenderer = read('js/ui/runtime-widgets-chat-message.js');
const css = read('css/frontend-polish.css');

assert.match(messageRenderer, /openImagePreview/, 'message renderer opens a full-size image preview');
assert.match(messageRenderer, /groupchat-image-thumbnail/, 'message images are marked as clickable thumbnails');
assert.match(messageRenderer, /groupchat-image-preview-overlay/, 'image preview overlay is created by the message renderer');
assert.match(messageRenderer, /aria-label', '关闭图片预览'/, 'image preview exposes an accessible close button');
assert.match(messageRenderer, /event\.key === 'Escape'/, 'image preview closes on Escape');

assert.match(css, /\.groupchat-image-thumbnail\s*\{[\s\S]*?cursor\s*:\s*zoom-in\s*;/, 'message image thumbnail indicates zoom affordance');
assert.match(css, /\.groupchat-image-preview-overlay\s*\{[\s\S]*?position\s*:\s*fixed\s*;/, 'preview overlay covers the viewport');
assert.match(css, /\.groupchat-image-preview-image\s*\{[\s\S]*?max-width\s*:\s*min\(92vw,\s*1280px\)\s*;/, 'preview image is constrained to viewport width');
assert.match(css, /\.groupchat-image-preview-close\s*\{[\s\S]*?position\s*:\s*absolute\s*;/, 'preview close control is positioned over the overlay');

console.log('message image preview smoke checks passed');
