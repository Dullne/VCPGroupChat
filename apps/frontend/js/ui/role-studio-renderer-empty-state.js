export function applyRoleStudioEmptyDraftState(dom) {
    dom.createRoleFromDraftBtn.disabled = true;
    dom.saveRoleDraftBtn.disabled = true;
    dom.saveRoleDraftTeamBtn.disabled = true;
    dom.saveRoleDraftGroupBtn.disabled = true;
    dom.roleDraftName.textContent = '';
    dom.roleDraftDescription.textContent = '';
    dom.roleDraftMeta.innerHTML = '';
    dom.roleDraftMeta.classList.add('role-draft-content-hidden');
    dom.roleDraftMemory.innerHTML = '';
    dom.roleDraftResponsibilities.innerHTML = '';
    dom.roleDraftPersona.textContent = '';
    dom.roleDraftTemplate.textContent = '';
}
