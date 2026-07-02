import { translateUiText } from '../core/i18n.js';

export function createAsyncActionButton({ label, handler, variant = 'primary', showToast }) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `role-action-btn role-action-${variant}`;
    button.textContent = label;
    button.addEventListener('click', async () => {
        button.disabled = true;
        try {
            await handler();
        } catch (error) {
            console.error(error);
            showToast(error.message || '操作失败', 'danger');
        } finally {
            button.disabled = false;
        }
    });
    return button;
}

export function buildRoleBadgeContainer(badges) {
    const container = document.createElement('div');
    container.className = 'role-badges';
    for (const badge of badges.filter(Boolean)) {
        const item = document.createElement('span');
        item.className = 'role-badge';
        item.textContent = translateUiText(badge);
        container.appendChild(item);
    }
    return container;
}
