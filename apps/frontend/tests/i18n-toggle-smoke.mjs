import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = relativePath => readFileSync(join(repoRoot, relativePath), 'utf8');

const indexHtml = read('index.html');
assert.match(indexHtml, /id="language-toggle"/, 'header exposes a language toggle button');
assert.match(indexHtml, /aria-label="切换语言"/, 'language toggle is accessible');

const i18nPath = join(repoRoot, 'js/core/i18n.js');
assert.equal(existsSync(i18nPath), true, 'i18n module exists');

const i18nSource = read('js/core/i18n.js');
for (const exportName of ['getLocale', 'setLocale', 'toggleLocale', 'applyLocaleToDocument', 'syncLocalizedDom', 'translateUiText']) {
    assert.match(i18nSource, new RegExp(`export function ${exportName}\\b`), `i18n module exports ${exportName}`);
}

const rendererSource = read('js/ui/shell-renderer-render-all.js');
assert.match(rendererSource, /syncLocalizedDom/, 'shell render pass reapplies localized UI copy');

const { translateUiText } = await import('../js/core/i18n.js');

const dynamicTranslationCases = new Map([
    ['7 个角色 · 2 个历史群聊配置', '7 roles · 2 historical group configs'],
    ['默认团队 · 7 个角色 · 2 个历史群聊配置', '默认团队 · 7 roles · 2 historical group configs'],
    ['当前团队：默认团队。已加入 7 个角色，可按标签或关键词筛选后加入。', 'Current team: 默认团队. 7 roles joined. Filter by tag or keyword to add more.'],
    ['当前团队：默认团队。已加入 7 个角色，可选 12 个；当前标签：产品。', 'Current team: 默认团队. 7 roles joined, 12 available; current tag: 产品.'],
    ['未分组 · 1 个角色', 'Ungrouped · 1 role'],
    ['团队负责按项目或方向收纳角色；群组才是真正上场聊天的 AI 房间。', 'Teams collect roles by project or direction; groups are the actual AI chat rooms.'],
    ['模式：顺序协作 · 每轮 2 · 候选 1 · 预计发言 1 · 前端预测', 'Mode: Sequential Collaboration · per round 2 · candidates 1 · expected speakers 1 · Frontend Prediction'],
    ['预计 1 个角色会发言，0 个候选暂不参与。发送消息后会替换成后端真实运行轨迹。', '1 role is expected to speak; 0 candidates will stay out. After sending, backend runtime trace will replace this preview.'],
    ['预计 2 个角色会发言，1 个候选暂不参与。发送消息后会替换成后端真实运行轨迹。', '2 roles are expected to speak; 1 candidate will stay out. After sending, backend runtime trace will replace this preview.'],
    ['当前未点名时，会按顺序轮转让候选角色参与，每轮最多 2 位。当前候选池包含：小吉、女仆。', 'When no role is mentioned, candidates rotate sequentially, up to 2 per round. Current candidate pool: 小吉、女仆.'],
    ['群聊状态与沉淀', 'Group Chat State and Memory'],
    ['第 2 轮 · 项目/决策会话 · 有保留共识', 'Round 2 · Project/Decision Chat · Consensus with caveats'],
    ['来源 11 条消息', '11 source messages'],
    ['10 位角色状态', '10 participant states'],
    ['2 条记忆沉淀', '2 memory items'],
    ['已发言 · 补充上下文 · 引用 1 条', 'Spoke · Added context · referenced 1 message'],
    ['还有 2 位角色状态未展开。', '2 participant states are still hidden.'],
    ['模型已禁用 qwen/qwen3.6-plus-preview:free', 'Model disabled qwen/qwen3.6-plus-preview:free'],
    ['运行模型：qwen/qwen3.6-plus-preview:free（已禁用，运行时自动回退）', 'Runtime model: qwen/qwen3.6-plus-preview:free (disabled; runtime will auto-fallback)']
]);

for (const [source, expected] of dynamicTranslationCases) {
    assert.equal(translateUiText(source, 'en'), expected, `translates dynamic UI copy: ${source}`);
}

const requiredTextSkipSelectors = [
    '#header-current-group-name',
    '#header-current-session-title',
    '.team-card-title',
    '.team-card-description',
    '.profile-summary-description',
    '.role-card-title',
    '.role-card-description',
    '.cognitive-member-name',
    '.cognitive-member-description',
    '.cognitive-synthesis-participant-name',
    '.cognitive-synthesis-item-content',
    '#cognitive-inspector-profile-name',
    '#cognitive-inspector-profile-summary',
    '#cognitive-inspector-charter',
    '.round-role-debug-name'
];

for (const selector of requiredTextSkipSelectors) {
    assert.match(i18nSource, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `i18n skips user data selector ${selector}`);
}

console.log('i18n toggle smoke checks passed');
