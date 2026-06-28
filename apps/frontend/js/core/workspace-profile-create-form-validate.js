export function resolveGroupProfileCreateContext(deps) {
    const {
        name,
        getManagedTeam,
        getManagedProfile,
        showToast
    } = deps;

    if (!name) {
        showToast('群组名称不能为空', 'warning');
        return null;
    }

    const managedTeam = getManagedTeam();
    if (!managedTeam) {
        showToast('暂时没有可用的群聊容器，请先到“团队”里创建一个角色池', 'warning');
        return null;
    }

    return {
        managedTeam,
        currentProfile: getManagedProfile()
    };
}
