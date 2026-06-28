import { createRuntimeModelManager } from './runtime-model-manager.js';
import { createTeamProfileManager } from './team-profile-manager.js';
import { createRoleDraftFormManager } from './role-draft-form-manager.js';
import { createRoleDraftActions } from './role-draft-actions.js';
import { createRoundRoleSelectionRuntime } from './round-role-selection.js';
import { createMessageActions } from './message-actions.js';
import { createMemoryReflectionActions } from './memory-reflection-actions.js';
import { createSessionManager } from './session-manager.js';
import { createSessionEventSyncManager } from './session-event-sync.js';
import { createRoleLibraryRuntime } from '../ui/role-library-runtime.js';

export function createCoreRuntime(deps) {
    const runtimeModelManager = createRuntimeModelManager(deps);
    const teamProfileManager = createTeamProfileManager(deps);
    const roleDraftFormManager = createRoleDraftFormManager(deps);
    const roleDraftActions = createRoleDraftActions(deps);
    const roundRoleSelectionRuntime = createRoundRoleSelectionRuntime(deps);
    const messageActions = createMessageActions(deps);
    const memoryReflectionActions = createMemoryReflectionActions(deps);
    const sessionManager = createSessionManager(deps);
    const sessionEventSyncManager = createSessionEventSyncManager({
        ...deps,
        refreshSessionsList: sessionManager.refreshSessionsList,
        reloadActiveSessionAndRoles: sessionManager.reloadActiveSessionAndRoles
    });
    const roleLibraryRuntime = createRoleLibraryRuntime({
        ...deps,
        onApplyRoleRuntimeModel: deps.updateRoleRuntimeModel
    });

    return {
        runtimeModelManager,
        teamProfileManager,
        roleDraftFormManager,
        roleDraftActions,
        roundRoleSelectionRuntime,
        messageActions,
        memoryReflectionActions,
        sessionManager,
        sessionEventSyncManager,
        startSessionEventSync: sessionEventSyncManager.start,
        stopSessionEventSync: sessionEventSyncManager.stop,
        roleLibraryRuntime
    };
}
