import { bindShellUiEvents } from './ui-event-bindings-shell.js';
import { bindSelectionImportEvents } from './ui-event-bindings-selection-import.js';
import { bindProfileTeamEvents } from './ui-event-bindings-profile-team.js';
import { bindRoleStudioEvents } from './ui-event-bindings-role-studio.js';
import { bindChatEvents } from './ui-event-bindings-chat.js';
import { bindMemoryReflectionEvents } from './ui-event-bindings-memory-reflection.js';

export function bindUiEventHandlers(deps) {
    const ctx = {
        ...deps,
        dom: deps.getDom()
    };

    bindShellUiEvents(ctx);
    bindSelectionImportEvents(ctx);
    bindProfileTeamEvents(ctx);
    bindRoleStudioEvents(ctx);
    bindMemoryReflectionEvents(ctx);
    bindChatEvents(ctx);
}
