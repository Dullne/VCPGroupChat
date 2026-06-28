export function createWorkspaceProfileFormLoader(deps) {
    const {
        getDom,
        showToast,
        getManagedProfile,
        applyGroupProfileModeOptionsToForm,
        renderGroupProfileModeOptions,
        setGroupProfileFormLoadedProfileId,
        renderGroupProfileFormStatus
    } = deps;

    function loadManagedProfileIntoForm() {
        const dom = getDom();
        const profile = getManagedProfile();
        if (!profile) {
            showToast('当前没有可载入的群聊配置', 'warning');
            return;
        }

        dom.groupProfileForm.querySelector('#group-profile-name').value = profile.name || '';
        dom.groupProfileForm.querySelector('#group-profile-description').value = profile.description || '';
        dom.groupProfileForm.querySelector('#group-profile-mode').value = String(profile.mode || 'sequential').trim().toLowerCase();
        dom.groupProfileForm.querySelector('#group-profile-invite-prompt').value = profile.invite_prompt || '';
        applyGroupProfileModeOptionsToForm(profile);
        renderGroupProfileModeOptions();
        dom.groupProfileForm.querySelector('#group-profile-prompt').value = profile.group_prompt || '';
        dom.groupProfileForm.querySelector('#group-profile-clone').checked = false;
        setGroupProfileFormLoadedProfileId(profile.id);
        renderGroupProfileFormStatus();
    }

    return {
        loadManagedProfileIntoForm
    };
}
