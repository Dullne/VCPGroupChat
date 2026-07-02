import { formatTeamDescription } from './workspace-renderers-team-copy.js';
import { translateUiText } from '../core/i18n.js';

export function renderWorkspaceCurrentTeamSummary(deps) {
    const {
        getDom,
        getManagedTeam,
        getManagedTeamMembers,
        getTeamDraftMode,
        getTeamDraftSelectedRoleIds
    } = deps;

    const dom = getDom();
    const team = getManagedTeam();
    if (!dom.currentTeamSummary) {
        return;
    }
    if (getTeamDraftMode?.()) {
        const selectedCount = getTeamDraftSelectedRoleIds?.().size || 0;
        dom.currentTeamSummary.innerHTML = '';
        const title = document.createElement('div');
        title.className = 'profile-summary-title';
        title.textContent = `团队草稿 · 已选 ${selectedCount} 个人物`;
        const description = document.createElement('div');
        description.className = 'profile-summary-description';
        description.textContent = selectedCount > 0
            ? '填写团队名称后提交，系统会创建团队并加入已选人物。'
            : '先从右侧选择人物，草稿不会自动带入默认团队人物。';
        dom.currentTeamSummary.appendChild(title);
        dom.currentTeamSummary.appendChild(description);
        return;
    }
    if (!team) {
        dom.currentTeamSummary.textContent = '当前没有选中的团队。';
        return;
    }

    dom.currentTeamSummary.innerHTML = '';
    const memberCount = typeof getManagedTeamMembers === 'function'
        ? getManagedTeamMembers().length
        : Number(team.member_count || 0);
    const title = document.createElement('div');
    title.className = 'profile-summary-title';
    const profileCount = Number(team.profile_count || 0);
    title.textContent = `${team.name} · ${memberCount} 个人物${profileCount > 0 ? ` · ${profileCount} 个历史群聊配置` : ''}`;
    const description = document.createElement('div');
    description.className = 'profile-summary-description';
    description.textContent = formatTeamDescription(team) || translateUiText('这个团队还没有说明。先把人物加入团队，日常发起群聊时就能快速筛选候选成员。');
    dom.currentTeamSummary.appendChild(title);
    dom.currentTeamSummary.appendChild(description);

    const formName = dom.teamForm.querySelector('#team-name');
    const formDescription = dom.teamForm.querySelector('#team-description');
    if (formName && document.activeElement !== formName) {
        formName.value = team.name || '';
    }
    if (formDescription && document.activeElement !== formDescription) {
        formDescription.value = team.description || '';
    }
}
