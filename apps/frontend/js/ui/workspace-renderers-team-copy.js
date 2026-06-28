import { translateUiText } from '../core/i18n.js';

const LEGACY_DEFAULT_TEAM_DESCRIPTION = '默认团队，承载历史群组模板。';

export function formatTeamDescription(team) {
    const description = String(team?.description || '').trim();
    if (!description) {
        return '';
    }
    if (description === LEGACY_DEFAULT_TEAM_DESCRIPTION) {
        return translateUiText('系统默认角色池，保留历史群聊入口与核心角色。');
    }
    return description;
}
