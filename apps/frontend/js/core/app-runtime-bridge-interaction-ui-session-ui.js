export function createRuntimeInteractionUiBridges(deps) {
    const {
        runtime,
        selectorsRuntime
    } = deps;

    const clearSelectedImage = (...args) => runtime.messageActions.clearSelectedImage(...args);
    const renderAll = (speakingRoleIds = []) => runtime.shellRenderer.renderAll(speakingRoleIds);
    const renderRoleManager = (...args) => runtime.shellRenderer.renderRoleManager(...args);
    const renderRoleStudio = (...args) => runtime.roleStudioRenderer.renderRoleStudio(...args);
    const clearLatestSelectionTrace = (...args) => runtime.roundRoleSelectionRuntime.clearLatestSelectionTrace(...args);
    const renderRoundRoleDebug = (selectableRoles = selectorsRuntime.getSelectableRoles()) =>
        runtime.roundRoleSelectionRuntime.renderRoundRoleDebug(selectableRoles);
    const renderRoleSelectionList = (...args) => runtime.roundRoleSelectionRuntime.renderRoleSelectionList(...args);
    const renderRoleSelectionSummary = (selectableRoles = selectorsRuntime.getSelectableRoles()) =>
        runtime.roundRoleSelectionRuntime.renderRoleSelectionSummary(selectableRoles);
    const generateSessionReflection = (...args) => runtime.memoryReflectionActions.generateSessionReflection(...args);
    const refreshSessionReflection = (...args) => runtime.memoryReflectionActions.refreshSessionReflection(...args);
    const confirmMemoryCandidate = (...args) => runtime.memoryReflectionActions.confirmMemoryCandidate(...args);
    const dismissMemoryCandidate = (...args) => runtime.memoryReflectionActions.dismissMemoryCandidate(...args);
    const confirmProjectAssets = (...args) => runtime.memoryReflectionActions.confirmProjectAssets(...args);
    const scanMemoryIndexCandidates = (...args) => runtime.memoryReflectionActions.scanMemoryIndexCandidates(...args);
    const requeueMemoryIndexBatch = (...args) => runtime.memoryReflectionActions.requeueMemoryIndexBatch(...args);
    const pruneSelectedRoles = (...args) => runtime.runtimeUiActions.pruneSelectedRoles(...args);
    const updateFloatingRoleWindow = (roles, speakingRoleIds = []) =>
        runtime.runtimeUiActions.updateFloatingRoleWindow(roles, speakingRoleIds);
    const appendMessage = (target, message) => runtime.runtimeUiActions.appendMessage(target, message);
    const toggleRoleManager = open => runtime.runtimeUiActions.toggleRoleManager(open);
    const adjustTextareaHeight = textarea => runtime.runtimeUiActions.adjustTextareaHeight(textarea);
    const scrollToBottom = container => runtime.runtimeUiActions.scrollToBottom(container);

    return {
        clearSelectedImage,
        renderAll,
        renderRoleManager,
        renderRoleStudio,
        clearLatestSelectionTrace,
        renderRoundRoleDebug,
        renderRoleSelectionList,
        renderRoleSelectionSummary,
        generateSessionReflection,
        refreshSessionReflection,
        confirmMemoryCandidate,
        dismissMemoryCandidate,
        confirmProjectAssets,
        scanMemoryIndexCandidates,
        requeueMemoryIndexBatch,
        pruneSelectedRoles,
        updateFloatingRoleWindow,
        appendMessage,
        toggleRoleManager,
        adjustTextareaHeight,
        scrollToBottom
    };
}
