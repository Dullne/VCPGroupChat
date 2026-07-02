export function createWorkspaceProfileDeleteAction(deps) {
    const {
        fetchJson,
        showToast,
        getManagedProfile,
        setSelectedProfileId,
        getBootstrapData,
        getActiveSession,
        refreshBootstrap,
        renderAll
    } = deps;

    return async function deleteManagedProfile() {
        const profile = getManagedProfile();
        const bootstrapData = getBootstrapData();
        const activeSession = getActiveSession();
        if (!profile) {
            showToast('当前没有可删除的群聊配置', 'warning');
            return;
        }
        if (profile.id === bootstrapData?.default_profile_id) {
            showToast('默认群聊配置不能删除', 'warning');
            return;
        }
        const sessionCount = Number(profile.session_count || 0);
        if (sessionCount > 0) {
            showToast(`该群聊配置已有 ${sessionCount} 个会话，当前不允许删除`, 'warning');
            return;
        }

        const confirmed = window.confirm(`确认删除群聊配置「${profile.name}」吗？此操作不会删除运行时角色，但会删除这套业务编排模板。`);
        if (!confirmed) {
            return;
        }

        await fetchJson(`/api/group-profiles/${encodeURIComponent(profile.id)}`, {
            method: 'DELETE'
        });

        const nextProfileId = activeSession?.profile_id || bootstrapData?.default_profile_id || null;
        setSelectedProfileId(nextProfileId);
        await refreshBootstrap(nextProfileId);
        renderAll();
        showToast(`已删除群聊配置：${profile.name}`, 'success');
    };
}
