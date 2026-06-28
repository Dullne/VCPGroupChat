// i18n table integrity test.
//
// Guards against silent debt in js/core/i18n.js:
//  - Duplicate TEXT_TRANSLATIONS keys (JS object literal silently keeps the
//    last, so an earlier translation is dead and the two often conflict).
//  - Duplicate PATTERN_TRANSLATIONS regex sources.
//
// These accumulate when multiple sessions append entries without checking.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(ROOT, 'js/core/i18n.js'), 'utf8');

// Limit to the TEXT_TRANSLATIONS object literal so PATTERN replacement strings
// (which can contain quoted text) are not mistaken for keys.
function textBlock() {
    const start = source.indexOf('TEXT_TRANSLATIONS');
    const open = source.indexOf('{', start);
    const close = source.indexOf('}))', open);
    return source.slice(open, close);
}

test('TEXT_TRANSLATIONS has no duplicate keys', () => {
    const block = textBlock();
    const keyRe = /^\s*("(?:[^"\\]|\\.)*")\s*:/gm;
    const seen = new Map();
    const dups = [];
    let m;
    while ((m = keyRe.exec(block))) {
        const key = m[1];
        if (seen.has(key)) dups.push(key);
        seen.set(key, (seen.get(key) || 0) + 1);
    }
    assert.equal(dups.length, 0, `Duplicate i18n TEXT keys (remove the dead earlier copy):\n${[...new Set(dups)].join('\n')}`);
});

test('PATTERN_TRANSLATIONS has no duplicate regex sources', () => {
    const start = source.indexOf('PATTERN_TRANSLATIONS');
    const block = source.slice(start);
    const patRe = /\[\/(.+?)\/,\s*match/g;
    const seen = new Set();
    const dups = [];
    let m;
    while ((m = patRe.exec(block))) {
        if (seen.has(m[1])) dups.push(m[1]);
        seen.add(m[1]);
    }
    assert.equal(dups.length, 0, `Duplicate i18n PATTERN sources:\n${[...new Set(dups)].join('\n')}`);
});
