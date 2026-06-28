export function bindRolePanelEvents(state, renderRolePanel) {
    document.getElementById('toggle-role-selection-btn')?.addEventListener('click', () => {
        state.roleSelectionExpanded = !state.roleSelectionExpanded;
        renderRolePanel();
    });

    document.getElementById('clear-role-selection-btn')?.addEventListener('click', () => {
        state.selectedIncludeRoleIds.clear();
        renderRolePanel();
    });

    document.querySelectorAll('.role-selection-item input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', event => {
            const roleId = event.target.dataset.roleId;
            if (event.target.checked) {
                state.selectedIncludeRoleIds.add(roleId);
            } else {
                state.selectedIncludeRoleIds.delete(roleId);
            }
            renderRolePanel();
        });
    });
}
