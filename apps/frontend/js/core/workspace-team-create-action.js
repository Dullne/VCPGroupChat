import {
    resolvePersonIdentityForRoleAction,
    resolveRoleNameForGroupAction
} from './role-library-group-actions-context.js';

async function addRoleToCreatedTeam(deps) {
    const {
        teamId,
        roleId,
        fetchJson,
        getAvailableRoles,
        getBootstrapData
    } = deps;

    const personIdentity = resolvePersonIdentityForRoleAction({
        roleId,
        getAvailableRoles,
        getBootstrapData
    });

    if (personIdentity) {
        if (!personIdentity.legacy_role_id) {
            throw new Error(`人物「${personIdentity.display_name || personIdentity.id}」还没有连接运行时角色`);
        }

        await fetchJson(`/api/teams/${encodeURIComponent(teamId)}/person-members`, {
            method: 'POST',
            body: {
                person_id: personIdentity.id
            }
        });
        return;
    }

    await fetchJson(`/api/teams/${encodeURIComponent(teamId)}/members`, {
        method: 'POST',
        body: {
            role_id: roleId,
            role_name: resolveRoleNameForGroupAction({
                roleId,
                getAvailableRoles,
                getBootstrapData
            })
        }
    });
}

export function createWorkspaceTeamCreateAction(deps) {
    const {
        getDom,
        fetchJson,
        showToast,
        refreshBootstrap,
        renderAll,
        getBootstrapData,
        getAvailableRoles,
        getSelectedProfileId,
        getSelectedTeamId,
        setSelectedTeamId,
        getTeamDraftMode,
        setTeamDraftMode,
        getTeamDraftSelectedRoleIds,
        clearTeamDraftSelectedRoleIds
    } = deps;

    return async function createTeamFromForm() {
        const dom = getDom();
        if (!getTeamDraftMode?.()) {
            showToast('请先点击「新建团队」，选择成员后再创建', 'warning');
            return;
        }

        const formData = new FormData(dom.teamForm);
        const name = String(formData.get('name') || '').trim();
        const description = String(formData.get('description') || '').trim();
        const selectedRoleIds = [...(getTeamDraftSelectedRoleIds?.() || [])].filter(Boolean);

        if (!name) {
            showToast('团队名称不能为空', 'warning');
            return;
        }

        if (!selectedRoleIds.length) {
            showToast('请先选择至少 1 个团队成员', 'warning');
            return;
        }

        const duplicateTeam = (getBootstrapData()?.teams || [])
            .find(team => String(team.name || '').trim() === name);
        if (duplicateTeam) {
            setSelectedTeamId(duplicateTeam.id);
            setTeamDraftMode(false);
            await refreshBootstrap(getSelectedProfileId());
            renderAll();
            showToast(`团队名称已存在，已切换到「${duplicateTeam.name}」，草稿成员未自动加入`, 'warning');
            return;
        }

        try {
            const result = await fetchJson('/api/teams', {
                method: 'POST',
                body: { name, description }
            });

            const createdTeamId = result.team?.id;
            if (!createdTeamId) {
                throw new Error('后端没有返回新团队 ID');
            }

            const failedMembers = [];
            for (const roleId of selectedRoleIds) {
                try {
                    await addRoleToCreatedTeam({
                        teamId: createdTeamId,
                        roleId,
                        fetchJson,
                        getAvailableRoles,
                        getBootstrapData
                    });
                } catch (error) {
                    failedMembers.push(`${roleId}: ${error.message || '未知错误'}`);
                }
            }

            dom.teamForm.reset();
            clearTeamDraftSelectedRoleIds();
            setTeamDraftMode(false);
            setSelectedTeamId(createdTeamId || getSelectedTeamId());
            await refreshBootstrap(getSelectedProfileId());
            renderAll();
            if (failedMembers.length) {
                showToast(`已创建团队：${result.team?.name || name}，但 ${failedMembers.length} 个成员加入失败`, 'warning');
                return;
            }
            showToast(`已创建团队：${result.team?.name || name}，已加入 ${selectedRoleIds.length} 个成员`, 'success');
        } catch (error) {
            showToast(`创建团队失败：${error.message || '未知错误'}`, 'danger');
        }
    };
}
