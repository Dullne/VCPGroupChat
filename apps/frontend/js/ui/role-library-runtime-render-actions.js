import { renderRoleLibraryImportSourceList } from './role-library-runtime-import-sources.js';
import { renderRoleLibrarySessionRoleList } from './role-library-runtime-session-roles.js';

export function createRenderRoleLibraryImportSourceListAction(deps) {
    const {
        getDom,
        getExternalImportSources,
        isRoleInManagedTeam,
        isRoleInManagedProfile
    } = deps;

    return function renderImportSourceList() {
        renderRoleLibraryImportSourceList({
            getDom,
            getExternalImportSources,
            isRoleInManagedTeam,
            isRoleInManagedProfile
        });
    };
}

export function createRenderRoleLibrarySessionRoleListAction(deps) {
    const {
        getDom,
        getBootstrapData,
        getExternalImportSources,
        getSortedRolesForPanel,
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

    return function renderSessionRoleList() {
        renderRoleLibrarySessionRoleList({
            getDom,
            getBootstrapData,
            getExternalImportSources,
            getSortedRolesForPanel,
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
        });
    };
}
