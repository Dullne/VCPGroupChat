import { renderRoleLibraryImportSourceList } from './role-library-runtime-import-sources.js';
import { renderRoleLibrarySessionRoleList } from './role-library-runtime-session-roles.js';

export function createRenderRoleLibraryImportSourceListAction(deps) {
    const {
        getDom,
        getExternalImportSources,
        importCatalogRole,
        getImportedRoleIdFromCatalogItem,
        isRoleInManagedTeam,
        isRoleInManagedProfile,
        removeRoleFromGroup,
        showToast
    } = deps;

    return function renderImportSourceList() {
        renderRoleLibraryImportSourceList({
            getDom,
            getExternalImportSources,
            importCatalogRole,
            getImportedRoleIdFromCatalogItem,
            isRoleInManagedTeam,
            isRoleInManagedProfile,
            removeRoleFromGroup,
            showToast
        });
    };
}

export function createRenderRoleLibrarySessionRoleListAction(deps) {
    const {
        getDom,
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
