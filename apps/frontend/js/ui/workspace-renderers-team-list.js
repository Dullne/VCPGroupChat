import { formatTeamDescription } from './workspace-renderers-team-copy.js';
import { translateUiText } from '../core/i18n.js';

export function renderWorkspaceTeamList(deps) {
    const {
        getDom,
        getFilteredTeams,
        getManagedTeamId,
        getManagedTeamMembers,
        getTeamDraftMode,
        getTeamDraftSelectedRoleIds,
        startTeamDraft,
        setTeamDraftMode,
        setManagedTeam,
        renderAll
    } = deps;

    const dom = getDom();
    if (!dom.teamList) {
        return;
    }
    dom.teamList.innerHTML = '';
    const selectedDraftCount = getTeamDraftSelectedRoleIds?.().size || 0;
    const draftCard = document.createElement('button');
    draftCard.type = 'button';
    draftCard.className = 'team-card team-draft-card';
    if (getTeamDraftMode?.()) {
        draftCard.classList.add('team-card-active');
    }
    draftCard.addEventListener('click', () => {
        if (getTeamDraftMode?.()) {
            return;
        }
        startTeamDraft?.();
    });
    const draftTitle = document.createElement('div');
    draftTitle.className = 'team-card-title';
    draftTitle.textContent = '团队草稿';
    const draftMeta = document.createElement('div');
    draftMeta.className = 'team-card-meta';
    draftMeta.textContent = selectedDraftCount > 0
        ? `已选 ${selectedDraftCount} 个人物`
        : '先选择人物，再创建团队';
    const draftDesc = document.createElement('div');
    draftDesc.className = 'team-card-description';
    draftDesc.textContent = '不会自动继承默认团队；需要时可显式复制默认人物。';
    draftCard.appendChild(draftTitle);
    draftCard.appendChild(draftMeta);
    draftCard.appendChild(draftDesc);
    dom.teamList.appendChild(draftCard);

    const visibleTeams = getFilteredTeams();
    if (!visibleTeams.length) {
        const empty = document.createElement('div');
        empty.className = 'role-empty';
        empty.textContent = '当前筛选没有匹配团队。';
        dom.teamList.appendChild(empty);
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
            setTeamDraftMode?.(false);
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
        meta.textContent = `${memberCount} 个人物${profileCount > 0 ? ` · ${profileCount} 个历史群聊配置` : ''}`;

        const desc = document.createElement('div');
        desc.className = 'team-card-description';
        desc.textContent = formatTeamDescription(team) || translateUiText('暂无团队说明');

        card.appendChild(title);
        card.appendChild(meta);
        card.appendChild(desc);
        dom.teamList.appendChild(card);
    }
}
