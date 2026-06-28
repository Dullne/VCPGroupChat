import { translateUiText } from '../core/i18n.js';
export function applyModalViewToggle({ mode }) {
    const modal = document.getElementById('role-manager-modal');
    const title = document.getElementById('workspace-panel-title');
    const subtitle = document.getElementById('workspace-panel-subtitle');

    const views = {
        launcher: document.getElementById('team-manager-view'),
        team: document.getElementById('team-manager-view'),
        studio: document.getElementById('role-studio-view'),
        library: document.getElementById('role-library-view')
    };

    Object.values(views).forEach(v => v?.classList.add('workspace-view-hidden'));

    if (views[mode]) {
        views[mode].classList.remove('workspace-view-hidden');
    }

    const titles = {
        launcher: '发起群聊',
        team: '团队管理',
        studio: '角色工坊',
        library: '角色库'
    };
    if (title) {
        title.textContent = translateUiText(titles[mode] || '管理');
    }
    if (subtitle) {
        subtitle.textContent = '';
    }

    modal?.classList.remove('role-manager-hidden');
    modal?.classList.add('role-manager-open');
}

export function applyModalClose() {
    const modal = document.getElementById('role-manager-modal');
    modal?.classList.remove('role-manager-open');
    modal?.classList.add('role-manager-hidden');
}
