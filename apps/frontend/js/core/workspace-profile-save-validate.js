export function validateWorkspaceProfileSaveContext(deps) {
    const {
        profile,
        loadedProfileId,
        getProfileById,
        showToast
    } = deps;

    if (!profile) {
        showToast('当前没有可保存的群聊配置', 'warning');
        return false;
    }

    if (loadedProfileId !== profile.id) {
        const loadedProfile = loadedProfileId ? getProfileById(loadedProfileId) : null;
        showToast(
            loadedProfile
                ? `当前表单载入的是「${loadedProfile.name}」，当前管理的是「${profile.name}」。请先点击”载入当前模板”再保存`
                : `当前表单处于新建模式，尚未载入「${profile.name}」。请先点击”载入当前模板”再保存`,
            'warning'
        );
        return false;
    }

    return true;
}

export function validateWorkspaceProfileSaveFormValues(deps) {
    const {
        values,
        showToast
    } = deps;

    if (!values.name) {
        showToast('群组名称不能为空', 'warning');
        return false;
    }
    if (!values.groupPrompt) {
        showToast('群组级协作指令不能为空', 'warning');
        return false;
    }
    return true;
}
