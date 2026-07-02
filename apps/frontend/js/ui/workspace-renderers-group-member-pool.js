import { createWorkspaceGroupMemberCard } from './workspace-renderers-group-member-card.js';
import { getWorkspaceGroupMemberPoolCoreRoles } from './workspace-renderers-group-member-pool-core-roles.js';
import { renderUnboundPersonRuntimeBindingSection } from './workspace-renderers-person-runtime-binding.js';

export function renderWorkspaceGroupMemberPool(deps) {
    const {
        getDom,
        getManagedProfile,
        getManagedTeam,
        getBootstrapData,
        isRoleInManagedTeam,
        isRoleInManagedProfile,
        removeRoleFromGroup,
        addRoleToGroup,
        personRuntimeActions,
        showToast
    } = deps;

    const dom = getDom();
    if (!dom.groupMemberPoolList) {
        return;
    }

    const profile = getManagedProfile();
    const team = getManagedTeam();
    const bootstrapData = getBootstrapData();
    dom.groupMemberPoolList.innerHTML = '';

    if (!team) {
        dom.groupMemberPoolMeta.textContent = '请先选择团队。';
        dom.groupMemberPoolList.innerHTML = '<div class="role-empty">未选择团队。</div>';
        return;
    }

    if (!profile) {
        dom.groupMemberPoolMeta.textContent = `当前团队：${team.name}。请先选择或创建群聊配置。`;
        dom.groupMemberPoolList.innerHTML = '<div class="role-empty">未选择群聊配置。</div>';
        return;
    }

    const coreRoles = getWorkspaceGroupMemberPoolCoreRoles(bootstrapData, isRoleInManagedTeam);

    dom.groupMemberPoolMeta.textContent = `当前团队：${team.name} · 当前群组：${profile.name}。从团队人物池中拉人入群或移出。`;

    if (!coreRoles.length) {
        const renderedUnboundPersons = renderUnboundPersonRuntimeBindingSection({
            container: dom.groupMemberPoolList,
            bootstrapData,
            personRuntimeActions,
            showToast
        });
        if (!renderedUnboundPersons) {
            dom.groupMemberPoolList.innerHTML = '<div class="role-empty">当前团队还没有人物，请先在上方“团队拉人”中拉入长期人物。</div>';
        }
        return;
    }

    renderUnboundPersonRuntimeBindingSection({
        container: dom.groupMemberPoolList,
        bootstrapData,
        personRuntimeActions,
        showToast
    });

    for (const role of coreRoles) {
        dom.groupMemberPoolList.appendChild(createWorkspaceGroupMemberCard({
            role,
            bootstrapData,
            isRoleInManagedProfile,
            removeRoleFromGroup,
            addRoleToGroup,
            showToast
        }));
    }
}
