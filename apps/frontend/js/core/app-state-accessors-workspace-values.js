export function createWorkspaceStateValueAccessors(deps) {
    const {
        state,
        getStateValue,
        setStateValue
    } = deps;

    const getWorkspaceMode = getStateValue('workspaceMode');
    const setWorkspaceMode = setStateValue('workspaceMode');
    const getTeamDraftMode = getStateValue('teamDraftMode');
    const setTeamDraftMode = setStateValue('teamDraftMode');
    const getTeamDraftSelectedRoleIds = getStateValue('teamDraftSelectedRoleIds');
    const setTeamDraftSelectedRoleIds = setStateValue('teamDraftSelectedRoleIds');
    const getRoleSelectionExpanded = getStateValue('roleSelectionExpanded');
    const setRoleSelectionExpanded = setStateValue('roleSelectionExpanded');
    const getLatestRoleDraft = getStateValue('latestRoleDraft');
    const setLatestRoleDraft = setStateValue('latestRoleDraft');
    const getLatestRoleDraftMeta = getStateValue('latestRoleDraftMeta');
    const setLatestRoleDraftMeta = setStateValue('latestRoleDraftMeta');
    const getSelectedRoleStudioModel = getStateValue('selectedRoleStudioModel');
    const setSelectedRoleStudioModel = setStateValue('selectedRoleStudioModel');
    const getSelectedRoleRuntimeModel = getStateValue('selectedRoleRuntimeModel');
    const setSelectedRoleRuntimeModel = setStateValue('selectedRoleRuntimeModel');
    const getRoleStudioSources = getStateValue('roleStudioSources');
    const setRoleStudioSources = setStateValue('roleStudioSources');
    const getSelectedRoleStudioEngine = getStateValue('selectedRoleStudioEngine');
    const setSelectedRoleStudioEngine = setStateValue('selectedRoleStudioEngine');
    const getSelectedRoleStudioReferenceIds = getStateValue('selectedRoleStudioReferenceIds');
    const setSelectedRoleStudioReferenceIds = setStateValue('selectedRoleStudioReferenceIds');
    const getAdvancedRoleEditorExpanded = getStateValue('advancedRoleEditorExpanded');
    const setAdvancedRoleEditorExpanded = setStateValue('advancedRoleEditorExpanded');
    const getLauncherSelectedRoleIds = getStateValue('launcherSelectedRoleIds');
    const setLauncherSelectedRoleIds = setStateValue('launcherSelectedRoleIds');
    const getLauncherRoleFilterKeyword = getStateValue('launcherRoleFilterKeyword');
    const setLauncherRoleFilterKeyword = setStateValue('launcherRoleFilterKeyword');
    const getLauncherRoleTagFilter = getStateValue('launcherRoleTagFilter');
    const setLauncherRoleTagFilter = setStateValue('launcherRoleTagFilter');
    const getLatestSelectionTrace = getStateValue('latestSelectionTrace');
    const setLatestSelectionTrace = setStateValue('latestSelectionTrace');
    const getMemoryReflection = getStateValue('memoryReflection');
    const setMemoryReflection = setStateValue('memoryReflection');
    const getMemoryCandidates = getStateValue('memoryCandidates');
    const setMemoryCandidates = setStateValue('memoryCandidates');
    const getMemoryIndexRepair = getStateValue('memoryIndexRepair');
    const setMemoryIndexRepair = setStateValue('memoryIndexRepair');

    const clearLauncherSelectedRoleIds = () => {
        state.launcherSelectedRoleIds = new Set();
    };
    const clearTeamDraftSelectedRoleIds = () => {
        state.teamDraftSelectedRoleIds = new Set();
    };
    const clearMemoryReflectionState = () => {
        state.memoryReflection = null;
        state.memoryCandidates = [];
        state.memoryIndexRepair = {
            loading: false,
            scan: null,
            lastAction: null,
            error: ''
        };
    };

    return {
        getWorkspaceMode,
        setWorkspaceMode,
        getTeamDraftMode,
        setTeamDraftMode,
        getTeamDraftSelectedRoleIds,
        setTeamDraftSelectedRoleIds,
        clearTeamDraftSelectedRoleIds,
        getRoleSelectionExpanded,
        setRoleSelectionExpanded,
        getLatestRoleDraft,
        setLatestRoleDraft,
        getLatestRoleDraftMeta,
        setLatestRoleDraftMeta,
        getSelectedRoleStudioModel,
        setSelectedRoleStudioModel,
        getSelectedRoleRuntimeModel,
        setSelectedRoleRuntimeModel,
        getRoleStudioSources,
        setRoleStudioSources,
        getSelectedRoleStudioEngine,
        setSelectedRoleStudioEngine,
        getSelectedRoleStudioReferenceIds,
        setSelectedRoleStudioReferenceIds,
        getAdvancedRoleEditorExpanded,
        setAdvancedRoleEditorExpanded,
        getLauncherSelectedRoleIds,
        setLauncherSelectedRoleIds,
        clearLauncherSelectedRoleIds,
        getLauncherRoleFilterKeyword,
        setLauncherRoleFilterKeyword,
        getLauncherRoleTagFilter,
        setLauncherRoleTagFilter,
        getLatestSelectionTrace,
        setLatestSelectionTrace,
        getMemoryReflection,
        setMemoryReflection,
        getMemoryCandidates,
        setMemoryCandidates,
        getMemoryIndexRepair,
        setMemoryIndexRepair,
        clearMemoryReflectionState
    };
}
