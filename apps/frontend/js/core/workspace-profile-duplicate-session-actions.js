export function createWorkspaceProfileDuplicateSessionActions(deps) {
    const {
        fetchJson,
        showToast,
        getManagedProfile,
        getManagedTeamId,
        getProfileById,
        refreshBootstrap,
        setManagedProfile,
        loadManagedProfileIntoForm,
        renderAll,
        createSession
    } = deps;

    async function duplicateManagedProfile(profileId = null) {
        const profile = profileId ? getProfileById(profileId) : getManagedProfile();
        if (!profile) {
            showToast('当前没有可复制的群聊配置', 'warning');
            return;
        }

        const suggestedName = `${profile.name} 副本`;
        const nextName = window.prompt('请输入新群组名称', suggestedName);
        if (!nextName || !nextName.trim()) {
            return;
        }

        const created = await fetchJson('/api/group-profiles', {
            method: 'POST',
            body: {
                name: nextName.trim(),
                team_id: profile.team_id || getManagedTeamId(),
                clone_from_profile_id: profile.id
            }
        });

        await refreshBootstrap(created.profile.id);
        setManagedProfile(created.profile.id);
        loadManagedProfileIntoForm();
        renderAll();
        showToast(`已复制群聊配置：${created.profile.name}`, 'success');
    }

    async function startSessionWithManagedProfile(profileId = null) {
        const profile = profileId ? getProfileById(profileId) : getManagedProfile();
        if (!profile) {
            showToast('当前没有可用的群聊配置', 'warning');
            return;
        }

        await createSession(profile.id);
        renderAll();
    }

    return {
        duplicateManagedProfile,
        startSessionWithManagedProfile
    };
}
