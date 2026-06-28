export function resetGroupProfileCreateForm(deps) {
    const {
        dom,
        setGroupProfileFormLoadedProfileId,
        applyGroupProfileModeOptionsToForm,
        renderGroupProfileModeOptions
    } = deps;

    dom.groupProfileForm.reset();
    setGroupProfileFormLoadedProfileId(null);
    dom.groupProfileForm.querySelector('#group-profile-mode').value = 'sequential';
    applyGroupProfileModeOptionsToForm(null);
    renderGroupProfileModeOptions();
    dom.groupProfileForm.querySelector('#group-profile-clone').checked = true;
    dom.groupProfileForm.querySelector('#group-profile-start-session').checked = true;
}
