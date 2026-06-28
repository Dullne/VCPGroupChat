export function bindSelectionImportEvents(deps) {
    const {
        dom,
        clearLatestSelectionTrace,
        clearSelectedIncludeRoleIds,
        renderRoleSelectionList,
        getRoleSelectionExpanded,
        setRoleSelectionExpanded,
        renderRoleSelectionSummary,
        refreshImportSources,
        renderRoleManager,
        showToast
    } = deps;

    dom.clearRoleSelectionBtn.addEventListener('click', () => {
        clearLatestSelectionTrace();
        clearSelectedIncludeRoleIds();
        renderRoleSelectionList();
    });

    dom.roleSelectionToggleBtn.addEventListener('click', () => {
        setRoleSelectionExpanded(!getRoleSelectionExpanded());
        renderRoleSelectionSummary();
    });

    dom.refreshImportSourcesBtn.addEventListener('click', async () => {
        dom.refreshImportSourcesBtn.disabled = true;
        try {
            await refreshImportSources();
            renderRoleManager();
        } catch (error) {
            console.error(error);
            showToast(`刷新外部目录失败：${error.message}`, 'danger');
        } finally {
            dom.refreshImportSourcesBtn.disabled = false;
        }
    });
}
