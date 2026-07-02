import { buildEphemeralRoleCreatePayload } from './ephemeral-role-create-payload.js';

const TARGET_LABELS = {
    library: '人物通讯录',
    team: '当前团队',
    group: '当前群组'
};

function buildRoleStudioSavePayload(deps) {
    const {
        dom,
        latestRoleDraft,
        defaultSharedNotebook,
        target,
        teamId,
        profileId
    } = deps;

    const formData = new FormData(dom.ephemeralRoleForm);
    const name = String(formData.get('name') || '').trim();
    if (!name) {
        return null;
    }

    return {
        target,
        team_id: teamId || null,
        profile_id: profileId || null,
        source: 'role_studio',
        draft: buildEphemeralRoleCreatePayload({
            formData,
            name,
            latestRoleDraft,
            defaultSharedNotebook
        })
    };
}

export function createRoleStudioSaveAction(deps) {
    const {
        getDom,
        getLatestRoleDraft,
        getManagedTeamId,
        getManagedProfileId,
        fetchJson,
        showToast,
        refreshBootstrap,
        reloadActiveSessionAndRoles,
        renderAll,
        defaultSharedNotebook
    } = deps;

    return async function saveRoleDraft(target = 'library') {
        const normalizedTarget = ['library', 'team', 'group'].includes(target) ? target : 'library';
        const dom = getDom();
        const latestRoleDraft = getLatestRoleDraft();
        const teamId = normalizedTarget === 'team' ? getManagedTeamId() : null;
        const profileId = normalizedTarget === 'group' ? getManagedProfileId() : null;

        if (normalizedTarget === 'team' && !teamId) {
            showToast('请先选择团队', 'warning');
            return;
        }
        if (normalizedTarget === 'group' && !profileId) {
            showToast('请先选择群组', 'warning');
            return;
        }

        const payload = buildRoleStudioSavePayload({
            dom,
            latestRoleDraft,
            defaultSharedNotebook,
            target: normalizedTarget,
            teamId,
            profileId
        });
        if (!payload) {
            showToast('人物名称不能为空', 'warning');
            return;
        }

        const buttons = [
            dom.saveRoleDraftBtn,
            dom.saveRoleDraftTeamBtn,
            dom.saveRoleDraftGroupBtn
        ].filter(Boolean);
        buttons.forEach(button => {
            button.disabled = true;
        });
        dom.roleIdeaStatus.textContent = `正在保存到${TARGET_LABELS[normalizedTarget]}...`;
        dom.roleIdeaStatus.className = 'profile-form-status';

        try {
            const result = await fetchJson('/api/role-studio/save', {
                method: 'POST',
                body: payload
            });

            const personName = result?.person?.display_name || result?.role?.name || payload.draft.name;
            const preferredProfileId = result?.profile?.id || profileId || null;
            await refreshBootstrap(preferredProfileId);
            await reloadActiveSessionAndRoles();
            renderAll();

            dom.roleIdeaStatus.textContent = `已保存人物「${personName}」到${TARGET_LABELS[normalizedTarget]}。`;
            dom.roleIdeaStatus.className = 'profile-form-status profile-form-status-ready';
        } catch (error) {
            console.error(error);
            dom.roleIdeaStatus.textContent = `保存失败：${error.message}`;
            dom.roleIdeaStatus.className = 'profile-form-status profile-form-status-warning';
            showToast(`保存失败：${error.message}`, 'error');
        } finally {
            buttons.forEach(button => {
                button.disabled = false;
            });
        }
    };
}
