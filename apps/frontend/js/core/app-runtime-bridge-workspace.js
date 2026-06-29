export function createRuntimeWorkspaceBridges(deps) {
    const {
        runtime,
        selectorsRuntime,
        getConfig,
        getDom,
        fetchJsonWithConfig,
        normalizeNatureRandomModeOptionsModule,
        readGroupProfileModeOptionsFromFormHelper,
        applyGroupProfileModeOptionsToFormHelper,
        renderGroupProfileModeOptionsHelper
    } = deps;

    const createTeamFromForm = (...args) => runtime.workspaceActions.createTeamFromForm(...args);
    const startTeamDraft = (...args) => runtime.workspaceActions.startTeamDraft(...args);
    const copyDefaultTeamMembersToDraft = (...args) => runtime.workspaceActions.copyDefaultTeamMembersToDraft(...args);
    const updateManagedTeamFromForm = (...args) => runtime.workspaceActions.updateManagedTeamFromForm(...args);
    const deleteManagedTeam = (...args) => runtime.workspaceActions.deleteManagedTeam(...args);
    const normalizeNatureRandomModeOptions = (rawOptions = {}) => normalizeNatureRandomModeOptionsModule(rawOptions);
    const readGroupProfileModeOptionsFromForm = mode => readGroupProfileModeOptionsFromFormHelper({ mode, dom: getDom(), normalizeNatureRandomModeOptions });
    const applyGroupProfileModeOptionsToForm = (profile = null) => applyGroupProfileModeOptionsToFormHelper({ dom: getDom(), profile, normalizeNatureRandomModeOptions });
    const renderGroupProfileModeOptions = () => renderGroupProfileModeOptionsHelper({
        dom: getDom(),
        getManagedProfile: selectorsRuntime.getManagedProfile,
        applyGroupProfileModeOptionsToForm
    });
    const createGroupProfileFromForm = (...args) => runtime.workspaceActions.createGroupProfileFromForm(...args);
    const loadManagedProfileIntoForm = (...args) => runtime.workspaceActions.loadManagedProfileIntoForm(...args);
    const duplicateManagedProfile = (profileId = null) => runtime.workspaceActions.duplicateManagedProfile(profileId);
    const startSessionWithManagedProfile = (profileId = null) => runtime.workspaceActions.startSessionWithManagedProfile(profileId);
    const saveManagedProfileFromForm = (...args) => runtime.workspaceActions.saveManagedProfileFromForm(...args);
    const deleteManagedProfile = (...args) => runtime.workspaceActions.deleteManagedProfile(...args);
    const sendMessage = (...args) => runtime.messageActions.sendMessage(...args);
    const fetchJson = (pathname, options = {}) => fetchJsonWithConfig(getConfig(), pathname, options);

    return {
        createTeamFromForm,
        startTeamDraft,
        copyDefaultTeamMembersToDraft,
        updateManagedTeamFromForm,
        deleteManagedTeam,
        normalizeNatureRandomModeOptions,
        readGroupProfileModeOptionsFromForm,
        applyGroupProfileModeOptionsToForm,
        renderGroupProfileModeOptions,
        createGroupProfileFromForm,
        loadManagedProfileIntoForm,
        duplicateManagedProfile,
        startSessionWithManagedProfile,
        saveManagedProfileFromForm,
        deleteManagedProfile,
        sendMessage,
        fetchJson
    };
}
