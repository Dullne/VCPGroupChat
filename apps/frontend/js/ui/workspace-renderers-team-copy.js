import { translateUiText } from '../core/i18n.js';

const LEGACY_DEFAULT_TEAM_DESCRIPTION = '默认团队，承载历史群组模板。';
const DEPRECATED_2026_06_DEFAULT_TEAM_DESCRIPTION = [
    '系统默认',
    '角色',
    '池，保留历史群聊入口与核心',
    '角色。'
].join('');

export function formatTeamDescription(team) {
    const description = String(team?.description || '').trim();
    if (!description) {
        return '';
    }
    if (
        description === LEGACY_DEFAULT_TEAM_DESCRIPTION
        || description === DEPRECATED_2026_06_DEFAULT_TEAM_DESCRIPTION
    ) {
        return translateUiText('系统默认人物池，保留历史群聊入口与长期人物。');
    }
    return description;
}
