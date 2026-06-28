import { renderShellSessionMessages } from './shell-renderer-session-messages.js';
import { renderShellRoleManager } from './shell-renderer-role-manager.js';
import { renderShellSidebarGroupList } from './shell-renderer-sidebar-groups.js';
import { renderShellAll } from './shell-renderer-render-all.js';

export function createShellRenderer(deps) {
    const renderSessionMessages = () => {
        renderShellSessionMessages(deps);
    };

    const renderRoleManager = () => {
        renderShellRoleManager(deps);
    };

    const renderSidebarGroupList = () => {
        renderShellSidebarGroupList({
            ...deps,
            renderAll
        });
    };

    const renderAll = (speakingRoleIds = []) => {
        renderShellAll({
            ...deps,
            speakingRoleIds,
            renderSessionMessages,
            renderRoleManager,
            renderSidebarGroupList
        });
    };

    return {
        renderSessionMessages,
        renderRoleManager,
        renderAll
    };
}
