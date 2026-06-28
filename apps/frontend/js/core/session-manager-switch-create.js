import { createSessionSwitchAction } from './session-switch-action.js';
import { createSessionCreateAction } from './session-create-action.js';

export function createSessionSwitchCreateActions(deps) {
    const switchSession = createSessionSwitchAction(deps);
    const createSession = createSessionCreateAction(deps);

    return {
        switchSession,
        createSession
    };
}
