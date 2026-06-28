import { createRoleLibrarySessionRoleCard } from './role-library-runtime-session-role-card.js';
import {
    readRoleLibraryFilters,
    matchesRoleLibrarySessionRole,
    summarizeRoleLibraryState
} from './role-library-runtime-filters.js';

export function renderRoleLibrarySessionRoleList(deps) {
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

    const dom = getDom();
    dom.sessionRoleList.innerHTML = '';

    const roles = getSortedRolesForPanel();
    const externalImportSources = getExternalImportSources();
    const filters = readRoleLibraryFilters(dom);
    const summary = summarizeRoleLibraryState({
        roles,
        externalImportSources,
        isRoleInManagedProfile,
        isRoleInManagedTeam
    });
    if (dom.roleLibrarySummary) {
        dom.roleLibrarySummary.textContent = [
            `核心角色 ${summary.coreRoles}`,
            `临时角色 ${summary.ephemeralRoles}`,
            `当前团队 ${summary.teamMembers}`,
            `当前群组 ${summary.groupMembers}`,
            `外部模板 ${summary.catalogItems}`,
            `已导入 ${summary.importedCatalogItems}`
        ].join(' · ');
    }
    if (!roles.length) {
        dom.sessionRoleList.innerHTML = '<div class="role-empty">当前没有可展示角色。</div>';
        return;
    }

    const filteredRoles = roles.filter(role => matchesRoleLibrarySessionRole(role, filters, {
        isRoleInManagedProfile,
        isRoleInManagedTeam
    }));

    if (!filteredRoles.length) {
        dom.sessionRoleList.innerHTML = '<div class="role-empty">当前筛选条件下没有匹配的可用角色。</div>';
        return;
    }

    for (const role of filteredRoles) {
        dom.sessionRoleList.appendChild(createRoleLibrarySessionRoleCard({
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
        }));
    }
}
