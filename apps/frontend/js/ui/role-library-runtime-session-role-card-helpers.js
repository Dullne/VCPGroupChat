import { buildRoleLibrarySessionRoleActions } from './role-library-runtime-session-role-actions.js';
import { createRoleLibrarySessionRoleTitleRow } from './role-library-runtime-session-role-title-row.js';
import { buildRoleLibrarySessionRoleCardContentBlocks } from './role-library-runtime-session-role-card-content.js';

export function buildRoleLibrarySessionRoleCardBlocks(deps) {
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
        getRoleRuntimeModel,
        getRuntimeModelCandidates,
        onApplyRoleRuntimeModel,
        showToast
    } = deps;

    const titleRow = createRoleLibrarySessionRoleTitleRow(role, {
        isRoleInManagedTeam,
        isRoleInManagedProfile,
        getManagedProfileMemberPosition
    });

    const actions = buildRoleLibrarySessionRoleActions({
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
    });

    const {
        description,
        runtimeMeta,
        detailLoader,
        runtimeEditor
    } = buildRoleLibrarySessionRoleCardContentBlocks({
        role,
        getRoleRuntimeModel,
        getRuntimeModelCandidates,
        onApplyRoleRuntimeModel,
        showToast
    });

    return {
        titleRow,
        description,
        runtimeMeta,
        detailLoader,
        actions,
        runtimeEditor
    };
}
