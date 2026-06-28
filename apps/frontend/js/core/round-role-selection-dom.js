import { translateUiText } from './i18n.js';

export function buildBadgeContainer(badges) {
    const container = document.createElement('div');
    container.className = 'role-badges';
    for (const badge of badges.filter(Boolean)) {
        const item = document.createElement('span');
        item.className = 'role-badge';
        item.textContent = badge;
        container.appendChild(item);
    }
    return container;
}

export function renderRoundRoleDebugPanel(deps) {
    const {
        dom,
        preview,
        getRoundRoleDebugBadgeClass
    } = deps;

    dom.roundRoleDebugMeta.textContent = preview.meta;
    dom.roundRoleDebugList.innerHTML = '';

    if (!preview.rows.length) {
        dom.roundRoleDebugList.innerHTML = '<div class="round-role-debug-empty">当前没有可参与角色。</div>';
        return;
    }

    for (const row of preview.rows) {
        const item = document.createElement('div');
        item.className = `round-role-debug-item round-role-debug-item-${row.status}`;
        if (row.execution_error) {
            item.title = row.execution_error;
        }

        const name = document.createElement('div');
        name.className = 'round-role-debug-name';
        name.textContent = row.role?.name || row.role?.id || translateUiText('未知角色');

        const badges = document.createElement('div');
        badges.className = 'round-role-debug-badges';
        for (const reason of row.reasons) {
            const badge = document.createElement('span');
            badge.className = `round-role-debug-badge ${getRoundRoleDebugBadgeClass(reason)}`;
            badge.textContent = translateUiText(reason);
            badges.appendChild(badge);
        }

        item.appendChild(name);
        item.appendChild(badges);
        dom.roundRoleDebugList.appendChild(item);
    }
}
