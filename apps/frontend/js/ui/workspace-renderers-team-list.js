import { formatTeamDescription } from './workspace-renderers-team-copy.js';
import { translateUiText } from '../core/i18n.js';

export function renderWorkspaceTeamList(deps) {
    const {
        getDom,
        getFilteredTeams,
        getManagedTeamId,
        getManagedTeamMembers,
        setManagedTeam,
        renderAll
    } = deps;

    const dom = getDom();
    if (!dom.teamList) {
        return;
    }
    dom.teamList.innerHTML = '';
    const visibleTeams = getFilteredTeams();
    if (!visibleTeams.length) {
        dom.teamList.innerHTML = '<div class="role-empty">当前筛选没有匹配团队。</div>';
        return;
    }

    for (const team of visibleTeams) {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'team-card';
        if (team.id === getManagedTeamId()) {
            card.classList.add('team-card-active');
        }
        card.addEventListener('click', () => {
            setManagedTeam(team.id);
            renderAll();
        });

        const title = document.createElement('div');
        title.className = 'team-card-title';
        title.textContent = team.name;

        const memberCount = typeof getManagedTeamMembers === 'function' && team.id === getManagedTeamId()
            ? getManagedTeamMembers().length
            : Number(team.member_count || 0);
        const meta = document.createElement('div');
        meta.className = 'team-card-meta';
        const profileCount = Number(team.profile_count || 0);
        meta.textContent = `${memberCount} 个角色${profileCount > 0 ? ` · ${profileCount} 个历史群聊配置` : ''}`;

        const desc = document.createElement('div');
        desc.className = 'team-card-description';
        desc.textContent = formatTeamDescription(team) || translateUiText('暂无团队说明');

        card.appendChild(title);
        card.appendChild(meta);
        card.appendChild(desc);
        dom.teamList.appendChild(card);
    }
}
