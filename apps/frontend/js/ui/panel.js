// ========== 角色点名面板 ==========
import { state } from '../core/state.js';
import { buildRolePanelHtml } from './panel-template.js';
import { bindRolePanelEvents } from './panel-events.js';

export function renderRolePanel() {
    const container = document.getElementById('round-role-panel');
    if (!container) {
        return;
    }

    container.innerHTML = buildRolePanelHtml(state);
    bindRolePanelEvents(state, renderRolePanel);
}
