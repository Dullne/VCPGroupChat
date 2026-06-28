export function bindProfileFormEvents(deps) {
    const {
        dom,
        createGroupProfileFromForm,
        renderGroupProfileModeOptions,
        setProfileFilterKeyword,
        renderProfileSelectOptions,
        renderRoleManager,
        loadManagedProfileIntoForm,
        duplicateManagedProfile,
        startSessionWithManagedProfile,
        saveManagedProfileFromForm,
        deleteManagedProfile
    } = deps;

    dom.groupProfileForm.addEventListener('submit', async event => {
        event.preventDefault();
        await createGroupProfileFromForm();
    });

    dom.groupProfileModeSelect.addEventListener('change', () => {
        renderGroupProfileModeOptions();
    });

    const normalizeRandomRangeInputs = () => {
        const minValue = Number(dom.groupProfileRandomMin.value || 2);
        const maxValue = Number(dom.groupProfileRandomMax.value || 3);
        if (minValue > maxValue) {
            dom.groupProfileRandomMax.value = String(minValue);
        }
    };

    dom.groupProfileRandomMin.addEventListener('change', normalizeRandomRangeInputs);
    dom.groupProfileRandomMax.addEventListener('change', normalizeRandomRangeInputs);

    dom.groupProfileSearch.addEventListener('input', event => {
        setProfileFilterKeyword(String(event.target.value || '').trim().toLowerCase());
        renderProfileSelectOptions();
        renderRoleManager();
    });

    dom.loadGroupProfileBtn.addEventListener('click', () => {
        loadManagedProfileIntoForm();
    });

    dom.duplicateGroupProfileBtn.addEventListener('click', async () => {
        await duplicateManagedProfile();
    });

    dom.startSessionWithProfileBtn.addEventListener('click', async () => {
        await startSessionWithManagedProfile();
    });

    dom.saveGroupProfileBtn.addEventListener('click', async () => {
        await saveManagedProfileFromForm();
    });

    dom.deleteGroupProfileBtn.addEventListener('click', async () => {
        await deleteManagedProfile();
    });
}
