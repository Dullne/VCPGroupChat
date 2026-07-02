// i18n renderer coverage test.
//
// Guards against the recurring bug class where a renderer writes a Chinese
// string into a DOM text sink (.textContent / .innerHTML / badge text / <option>)
// that the i18n table cannot translate, so it stays Chinese in English mode.
//
// Invariant: every Chinese (CJK) chrome string a renderer emits into the DOM
// must be translatable by the i18n table (TEXT_TRANSLATIONS or PATTERN_TRANSLATIONS),
// using the real translateUiText() as the oracle. This covers BOTH application
// mechanisms (render-time translateUiText and post-render syncLocalizedDom).
//
// Genuine data defaults (notebook names, generic "none", etc.) and string
// fragments that are joined into a covered composite before display are listed
// in ALLOWLIST below — each addition is an explicit chrome-vs-data decision.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { translateUiText } = await import(join(ROOT, 'js/core/i18n.js'));

const CJK = /[一-鿿]/;

// Files excluded from the scan, with reason.
const EXCLUDE = [
    'js/core/i18n.js',           // the translation table itself
    'thin-backup',               // dead backup module
    '-legacy.js',                // legacy renderers, not imported by the active app
    'js/ui/sidebar.js',          // legacy sidebar, superseded by session-list-sidebar-renderer
];

// Intentional exceptions: genuine data defaults, or fragments joined into a
// covered composite. Keep this list small and reviewed.
const ALLOWLIST = new Set([
    '公共',   // default notebook name (also a real notebook), treated as data
    '无',     // generic "none" fallback; too generic to table-translate safely
    '默认团队', // backend default team name (data)
    // Fragments joined with " · " into the covered composite
    // "已扫描 N 个记忆文件 · 命中 N 个待补索引 · 上次提交 N 个入队":
    '已扫描 ${scannedCount} 个记忆文件',
    '命中 ${matchedCount} 个待补索引',
    '上次提交 ${lastQueuedCount} 个入队',
    // teamPrefix is one of "团队「<name>」" or "当前团队"; both runtime forms are
    // covered by dedicated patterns. The variable prefix defeats static probing.
    '${teamPrefix}下共 ${filteredCount} 套群聊配置（全局 ${totalCount}）。',
]);

function walk(dir, acc = []) {
    for (const entry of readdirSync(dir)) {
        const p = join(dir, entry);
        const rel = p.slice(ROOT.length + 1);
        if (EXCLUDE.some(x => rel.includes(x))) continue;
        const s = statSync(p);
        if (s.isDirectory()) walk(p, acc);
        else if (p.endsWith('.js') && !p.endsWith('.bak') && !p.includes('marked.min')) acc.push(p);
    }
    return acc;
}

// DOM text sinks: capture the assigned/argument expression.
// Also covers helper functions that internally call translateUiText — the
// helper itself translates, but the caller's string literal must still be
// in the i18n table for translation to work.
const SINK_RES = [
    /\.(?:textContent|innerHTML|innerText)\s*=\s*([\s\S]*?);/g,
    /\bcreateMemoryBadge\(\s*([\s\S]*?)(?:,|\))/g,
    /\{\s*text:\s*([\s\S]*?)(?:,\s*variant|,\s*kind|\})/g,
    /\bnew Option\(\s*([\s\S]*?),/g,
    // Helper functions that call translateUiText internally:
    /\bappendSynthesisEmpty\(\s*\w+\s*,\s*([\s\S]*?)\)/g,
    /\brenderRuntimeChips\(\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*([\s\S]*?)\)/g,
];
const STRING_LIT = /'([^'\\]*(?:\\.[^'\\]*)*)'|"([^"\\]*(?:\\.[^"\\]*)*)"|`([^`\\]*(?:\\.[^`\\]*)*)`/g;

// For an innerHTML literal, syncLocalizedDom translates the inner text nodes,
// so check the text fragments between tags rather than the whole HTML string.
function textFragments(raw) {
    if (/<[^>]+>/.test(raw)) {
        return raw.split(/<[^>]+>/).map(s => s.trim()).filter(s => CJK.test(s));
    }
    return [raw];
}

function isCovered(fragment) {
    // Substitute ${...} interpolations with a digit so numeric/.+ patterns match.
    const probe = fragment.replace(/\$\{[^}]*\}/g, '1').trim();
    if (!CJK.test(probe)) return true;
    // A leftover ` $ { or } means a nested-template literal was captured only
    // partially (e.g. `${a} 个角色${b > 0 ? ...`); the probe is unreliable, so
    // we can't judge coverage — skip rather than false-positive. The runtime
    // composite is checked elsewhere (its fully-formed pattern).
    if (/[`${}]/.test(probe)) return true;
    return translateUiText(probe, 'en') !== probe;
}

test('every CJK chrome string at a DOM sink is translatable by the i18n table', () => {
    const files = walk(join(ROOT, 'js/core')).concat(walk(join(ROOT, 'js/ui')));
    const violations = [];

    for (const file of files) {
        const src = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
        const rel = file.slice(ROOT.length + 1);
        for (const sinkRe of SINK_RES) {
            sinkRe.lastIndex = 0;
            let sinkMatch;
            while ((sinkMatch = sinkRe.exec(src))) {
                const expr = sinkMatch[1];
                STRING_LIT.lastIndex = 0;
                let litMatch;
                while ((litMatch = STRING_LIT.exec(expr))) {
                    const raw = litMatch[1] ?? litMatch[2] ?? litMatch[3] ?? '';
                    if (!CJK.test(raw)) continue;
                    for (const frag of textFragments(raw)) {
                        if (ALLOWLIST.has(frag) || ALLOWLIST.has(raw)) continue;
                        if (isCovered(frag)) continue;
                        violations.push(`${rel}: ${JSON.stringify(frag.slice(0, 60))}`);
                    }
                }
            }
        }
    }

    assert.equal(
        violations.length, 0,
        `Untranslated CJK chrome at DOM sinks (add an i18n entry or, if it is data, allowlist it):\n` +
        [...new Set(violations)].sort().join('\n')
    );
});
