import { createSessionListManager } from './session-manager-list.js';
import { createSessionLifecycleManager } from './session-manager-lifecycle.js';

export function createSessionManager(deps) {
    let refreshSessionsList = async () => {};
    let switchSession = async () => {};

    const lifecycle = createSessionLifecycleManager({
        ...deps,
        refreshSessionsList: (...args) => refreshSessionsList(...args)
    });
    const list = createSessionListManager({
        ...deps,
        switchSession: (...args) => switchSession(...args)
    });

    refreshSessionsList = list.refreshSessionsList;
    switchSession = lifecycle.switchSession;

    return {
        refreshSessionsList: list.refreshSessionsList,
        reloadActiveSessionAndRoles: lifecycle.reloadActiveSessionAndRoles,
        switchSession: lifecycle.switchSession,
        createSession: lifecycle.createSession
    };
}
