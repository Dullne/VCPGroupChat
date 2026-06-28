export function applyRoleSelectionSummaryControlState(deps) {
    const {
        dom,
        hasSelectableRoles,
        hasSelectedRoles,
        expanded
    } = deps;

    if (!hasSelectableRoles) {
        dom.roleSelectionToggleBtn.disabled = true;
        dom.clearRoleSelectionBtn.disabled = true;
        dom.roleSelectionToggleBtn.textContent = '展开';
        dom.roleSelectionListWrap.classList.add('round-role-selection-collapsed');
        return;
    }

    dom.roleSelectionToggleBtn.disabled = false;
    dom.clearRoleSelectionBtn.disabled = !hasSelectedRoles;
    dom.roleSelectionToggleBtn.textContent = expanded ? '收起' : '展开';
    dom.roleSelectionListWrap.classList.toggle('round-role-selection-collapsed', !expanded);
}
