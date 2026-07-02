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
        showToast('暂时没有可用的团队人物池，请先到“团队”里创建团队并加入长期人物', 'warning');
        return null;
    }

    return {
        managedTeam,
        currentProfile: getManagedProfile()
    };
}
