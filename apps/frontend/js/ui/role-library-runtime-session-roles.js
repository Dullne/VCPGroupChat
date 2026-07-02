import { createRoleLibrarySessionRoleCard } from './role-library-runtime-session-role-card.js';
import { getWorkspaceTeamMemberPoolCoreRoles } from './workspace-renderers-team-member-pool-core-roles.js';
import {
    readRoleLibraryFilters,
    matchesRoleLibrarySessionRole,
    summarizeRoleLibraryState
} from './role-library-runtime-filters.js';

export function renderRoleLibrarySessionRoleList(deps) {
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

    const dom = getDom();
    dom.sessionRoleList.innerHTML = '';

    const roles = getSortedRolesForPanel();
    const personRoles = getWorkspaceTeamMemberPoolCoreRoles(getBootstrapData?.() || {});
    const representedRuntimeRoleIds = new Set(
        personRoles
            .map(role => role.runtime_role?.id)
            .filter(Boolean)
    );
    const runtimeRoles = roles.filter(role => !representedRuntimeRoleIds.has(role.id));
    const externalImportSources = getExternalImportSources();
    const filters = readRoleLibraryFilters(dom);
    const summary = summarizeRoleLibraryState({
        roles: [...personRoles, ...runtimeRoles],
        externalImportSources,
        isRoleInManagedProfile,
        isRoleInManagedTeam
    });
    if (dom.roleLibrarySummary) {
        dom.roleLibrarySummary.textContent = [
            `长期人物 ${personRoles.length}`,
        `运行时角色列表 ${runtimeRoles.filter(role => role.source !== 'ephemeral').length}`,
            `临时角色 ${summary.ephemeralRoles}`,
            `当前团队 ${summary.teamMembers}`,
            `当前群组 ${summary.groupMembers}`,
            `外部模板 ${summary.catalogItems}`
        ].join(' · ');
    }
    if (!personRoles.length && !runtimeRoles.length) {
        dom.sessionRoleList.innerHTML = '<div class="role-empty">当前没有可展示人物或运行时角色。</div>';
        return;
    }

    const filteredPersonRoles = personRoles.filter(role => matchesRoleLibrarySessionRole(role, filters, {
        isRoleInManagedProfile,
        isRoleInManagedTeam
    }));
    const filteredRuntimeRoles = runtimeRoles.filter(role => matchesRoleLibrarySessionRole(role, filters, {
        isRoleInManagedProfile,
        isRoleInManagedTeam
    }));

    if (!filteredPersonRoles.length && !filteredRuntimeRoles.length) {
        dom.sessionRoleList.innerHTML = '<div class="role-empty">当前筛选条件下没有匹配的人物或运行时角色。</div>';
        return;
    }

    appendRoleSection({
        container: dom.sessionRoleList,
        title: '人物通讯录',
        hint: '长期人物是团队和群组的成员来源；运行时状态只决定能否直接上场。',
        roles: filteredPersonRoles,
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
    appendRoleSection({
        container: dom.sessionRoleList,
        title: '运行时角色列表',
        hint: '这里是执行层能力。未绑定人物的运行时角色不能直接成为团队或群组成员。',
        roles: filteredRuntimeRoles,
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
}

function appendRoleSection(deps) {
    const {
        container,
        title,
        hint,
        roles,
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

    if (!roles.length) {
        return;
    }

    const section = document.createElement('div');
    section.className = 'team-member-role-section role-library-section';
    const header = document.createElement('div');
    header.className = 'team-member-role-section-header';
    const heading = document.createElement('div');
    heading.className = 'team-member-role-section-title';
    heading.textContent = `${title} · ${roles.length}`;
    const note = document.createElement('div');
    note.className = 'role-manager-tip team-member-role-section-hint';
    note.textContent = hint;
    header.appendChild(heading);
    header.appendChild(note);
    section.appendChild(header);

    for (const role of roles) {
        section.appendChild(createRoleLibrarySessionRoleCard({
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

    container.appendChild(section);
}
