import { translateUiText } from './i18n.js';
export function renderTeamProfileSearchMeta(deps) {
    const {
        getDom,
        getManagedTeam,
        getProfileFilterKeyword,
        filteredCount,
        totalCount
    } = deps;

    const dom = getDom();
    if (!dom.groupProfileSearchMeta) {
        return;
    }

    const team = getManagedTeam();
    const teamPrefix = team ? `团队「${team.name}」` : '当前团队';
    const profileFilterKeyword = getProfileFilterKeyword();

    if (!profileFilterKeyword) {
        dom.groupProfileSearchMeta.textContent = translateUiText(`${teamPrefix}下共 ${filteredCount} 套群聊配置（全局 ${totalCount}）。`);
        return;
    }

    dom.groupProfileSearchMeta.textContent = `在${teamPrefix}中搜索“${profileFilterKeyword}”命中 ${filteredCount} 套（全局 ${totalCount}）。`;
}
