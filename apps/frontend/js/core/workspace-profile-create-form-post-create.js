export async function handleGroupProfileCreated(deps) {
    const {
        createdProfile,
        startSession,
        refreshBootstrap,
        setManagedProfile,
        createSession,
        renderAll,
        toggleRoleManager,
        showToast
    } = deps;

    await refreshBootstrap(createdProfile.id);
    setManagedProfile(createdProfile.id);

    if (startSession) {
        await createSession();
        renderAll();
        toggleRoleManager?.(false);
        showToast(`已创建群聊配置并切换到新会话：${createdProfile.name}`, 'success');
        return;
    }

    renderAll();
    showToast(`已创建群聊配置：${createdProfile.name}。点击 NEW 即可用这套群组开启新会话`, 'success');
}
