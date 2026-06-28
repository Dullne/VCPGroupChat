export function renderWorkspaceGroupProfileFormStatus(deps) {
    const {
        getDom,
        getManagedProfile,
        getGroupProfileFormLoadedProfileId,
        getProfileById
    } = deps;

    const dom = getDom();
    if (!dom.groupProfileFormStatus) {
        return;
    }

    const profile = getManagedProfile();
    const loadedProfileId = getGroupProfileFormLoadedProfileId();
    const loadedProfile = loadedProfileId ? getProfileById(loadedProfileId) : null;

    if (!profile) {
        dom.groupProfileFormStatus.textContent = '当前没有可管理模板，表单仅可用于新建。';
        dom.groupProfileFormStatus.className = 'profile-form-status';
        return;
    }

    if (loadedProfileId === profile.id) {
        dom.groupProfileFormStatus.textContent = `表单已载入「${profile.name}」，可以直接保存当前模板。`;
        dom.groupProfileFormStatus.className = 'profile-form-status profile-form-status-ready';
        return;
    }

    if (loadedProfile) {
        dom.groupProfileFormStatus.textContent = `表单当前载入的是「${loadedProfile.name}」，不是正在管理的「${profile.name}」。如需编辑当前模板，请先点击“载入当前模板”。`;
        dom.groupProfileFormStatus.className = 'profile-form-status profile-form-status-warning';
        return;
    }

    dom.groupProfileFormStatus.textContent = `表单当前处于新建模式。若要编辑「${profile.name}」，请先点击“载入当前模板”。`;
    dom.groupProfileFormStatus.className = 'profile-form-status';
}
