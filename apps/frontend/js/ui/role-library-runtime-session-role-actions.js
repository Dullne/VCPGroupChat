import { createAsyncActionButton } from './role-card-ui.js';
import { appendRoleLibrarySessionEphemeralActions } from './role-library-runtime-session-role-ephemeral-actions.js';
import { appendRoleLibrarySessionCoreActions } from './role-library-runtime-session-role-core-actions.js';

export function buildRoleLibrarySessionRoleActions(deps) {
    const {
        role,
        isRoleInManagedTeam,
        isRoleInManagedProfile,
        getManagedProfileMemberPosition,
        getManagedProfileEnabledMemberCount,
        removeRoleFromTeam,
        addRoleToTeam,
        removeRoleFromGroup,
        addRoleToGroup,
        moveRoleInManagedProfile,
        promoteEphemeralRole,
        deleteEphemeralRole,
        showToast
    } = deps;

    const actions = document.createElement('div');
    actions.className = 'role-card-actions';

    appendRoleLibrarySessionEphemeralActions(actions, {
        role,
        promoteEphemeralRole,
        deleteEphemeralRole,
        showToast
    });
    appendRoleLibrarySessionCoreActions(actions, {
        role,
        isRoleInManagedTeam,
        isRoleInManagedProfile,
        getManagedProfileMemberPosition,
        getManagedProfileEnabledMemberCount,
        removeRoleFromTeam,
        addRoleToTeam,
        removeRoleFromGroup,
        addRoleToGroup,
        moveRoleInManagedProfile,
        showToast
    });

    return actions;
}
