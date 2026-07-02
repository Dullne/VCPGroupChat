export function renderWorkspaceModeView(deps) {
    const {
        getDom,
        getWorkspaceMode
    } = deps;

    const dom = getDom();
    const workspaceMode = getWorkspaceMode();
    const modeConfig = {
        launcher: {
            title: '发起群聊',
            subtitle: '像微信群一样从人物通讯录选择长期人物，确认群名后创建群组并立即开聊。'
        },
        team: {
            title: '团队人物池',
            subtitle: '团队负责按项目或方向收纳长期人物；群组才是真正上场聊天的 AI 房间。'
        },
        studio: {
            title: '人物工坊',
            subtitle: '先用一句话生成人物草稿，再保存为长期人物；需要时也能作为当前会话临时角色试用。'
        },
        library: {
            title: '人物与模板',
            subtitle: '这里浏览长期人物、模板和运行时角色。人物是成员来源，模板用于创建人物，运行时角色只做执行和绑定。'
        }
    };
    const current = modeConfig[workspaceMode] || modeConfig.team;

    dom.workspacePanelTitle.textContent = current.title;
    dom.workspacePanelSubtitle.textContent = current.subtitle;
    const createGroupButton = dom.groupProfileForm?.querySelector('#create-group-profile-btn');
    if (createGroupButton) {
        createGroupButton.textContent = workspaceMode === 'launcher' ? '创建并开聊' : '创建这个群组';
    }
    dom.roleManagerModal?.classList.toggle('workspace-mode-launcher', workspaceMode === 'launcher');
    dom.roleManagerModal?.classList.toggle('workspace-mode-team', workspaceMode === 'team');
    dom.roleManagerModal?.classList.toggle('workspace-mode-studio', workspaceMode === 'studio');
    dom.roleManagerModal?.classList.toggle('workspace-mode-library', workspaceMode === 'library');
    dom.teamManagerView.classList.toggle('workspace-view-hidden', !['team', 'launcher'].includes(workspaceMode));
    dom.roleStudioView.classList.toggle('workspace-view-hidden', workspaceMode !== 'studio');
    dom.roleLibraryView.classList.toggle('workspace-view-hidden', workspaceMode !== 'library');

    const modeButtonMap = [
        [dom.launchGroupToggle, 'launcher'],
        [dom.teamManagerToggle, 'team'],
        [dom.roleStudioToggle, 'studio'],
        [dom.roleLibraryToggle, 'library']
    ];
    for (const [button, mode] of modeButtonMap) {
        button?.classList.toggle('workspace-toggle-active', mode === workspaceMode);
    }
    for (const button of dom.roleManagerModal?.querySelectorAll('[data-workspace-mode-toggle]') || []) {
        const active = button.dataset.workspaceModeToggle === workspaceMode;
        button.classList.toggle('workspace-toggle-active', active);
        button.setAttribute('aria-pressed', String(active));
    }
}
