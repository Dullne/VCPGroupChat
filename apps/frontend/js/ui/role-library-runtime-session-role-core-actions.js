import { createAsyncActionButton } from './role-card-ui.js';

export function appendRoleLibrarySessionCoreActions(actions, deps) {
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
        showToast
    } = deps;

    if (role.source === 'ephemeral') {
        return;
    }

    const personIdentity = role.person_identity || null;
    if (!personIdentity) {
        actions.appendChild(createAsyncActionButton({
            label: '先创建人物',
            handler: async () => {
                showToast('这不是长期人物，请先创建人物或绑定到人物后再加入团队或群组', 'warning');
            },
            variant: 'secondary',
            showToast
        }));
        return;
    }
    if (role.runtime_binding_status && role.runtime_binding_status !== 'ready') {
        actions.appendChild(createAsyncActionButton({
            label: '先绑定运行时',
            handler: async () => {
                showToast('这个人物还没有连接可用运行时角色，请先绑定运行时能力后再加入团队或群组', 'warning');
            },
            variant: 'secondary',
            showToast
        }));
        return;
    }

    if (!isRoleInManagedTeam(role.id)) {
        actions.appendChild(createAsyncActionButton({
            label: '加入当前团队',
            handler: async () => {
                await addRoleToTeam(role.id);
            },
            showToast
        }));
        return;
    }

    if (isRoleInManagedProfile(role.id)) {
        const position = getManagedProfileMemberPosition(role.id);
        const totalMembers = getManagedProfileEnabledMemberCount();

        const moveUpBtn = createAsyncActionButton({
            label: '上移',
            handler: async () => {
                await moveRoleInManagedProfile(role.id, 'up');
            },
            variant: 'secondary',
            showToast
        });
        moveUpBtn.disabled = position <= 1;

        const moveDownBtn = createAsyncActionButton({
            label: '下移',
            handler: async () => {
                await moveRoleInManagedProfile(role.id, 'down');
            },
            variant: 'secondary',
            showToast
        });
        moveDownBtn.disabled = position <= 0 || position >= totalMembers;

        actions.appendChild(moveUpBtn);
        actions.appendChild(moveDownBtn);
        actions.appendChild(createAsyncActionButton({
            label: '移出当前群组',
            handler: async () => {
                await removeRoleFromGroup(role.id);
            },
            variant: 'secondary',
            showToast
        }));
        actions.appendChild(createAsyncActionButton({
            label: '移出当前团队',
            handler: async () => {
                await removeRoleFromTeam(role.id);
            },
            variant: 'secondary',
            showToast
        }));
        return;
    }

    actions.appendChild(createAsyncActionButton({
        label: '加入当前群组',
        handler: async () => {
            await addRoleToGroup(role.id);
        },
        showToast
    }));
}
