export function createTeamDraftRoleActions(deps) {
    const {
        getTeamDraftSelectedRoleIds,
        setTeamDraftSelectedRoleIds,
        renderAll
    } = deps;

    function setNext(ids) {
        setTeamDraftSelectedRoleIds(new Set([...ids].filter(Boolean)));
        renderAll();
    }

    function addRoleToTeamDraft(roleId) {
        const normalizedRoleId = String(roleId || '').trim();
        if (!normalizedRoleId) {
            return;
        }
        const next = new Set(getTeamDraftSelectedRoleIds());
        next.add(normalizedRoleId);
        setNext(next);
    }

    function removeRoleFromTeamDraft(roleId) {
        const normalizedRoleId = String(roleId || '').trim();
        if (!normalizedRoleId) {
            return;
        }
        const next = new Set(getTeamDraftSelectedRoleIds());
        next.delete(normalizedRoleId);
        setNext(next);
    }

    return {
        addRoleToTeamDraft,
        removeRoleFromTeamDraft
    };
}
