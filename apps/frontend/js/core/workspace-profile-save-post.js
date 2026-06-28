export async function handleWorkspaceProfileSaved(deps) {
    const {
        updatedProfile,
        refreshBootstrap,
        getActiveSession,
        reloadActiveSessionAndRoles,
        setGroupProfileFormLoadedProfileId,
        renderAll,
        showToast
    } = deps;

    await refreshBootstrap(updatedProfile.id);
    if (getActiveSession()?.profile_id === updatedProfile.id) {
        await reloadActiveSessionAndRoles();
    }
    setGroupProfileFormLoadedProfileId(updatedProfile.id);
    renderAll();
    showToast(`已更新群聊配置：${updatedProfile.name}`, 'success');
}
