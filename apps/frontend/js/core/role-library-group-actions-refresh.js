export async function refreshGroupRoleActionsAfterMutation(deps) {
    const {
        profileId,
        refreshBootstrap,
        renderAll,
        activeSessionProfileId,
        reloadActiveSessionAndRoles
    } = deps;

    await refreshBootstrap(profileId);
    if (activeSessionProfileId && String(activeSessionProfileId) === String(profileId)) {
        await reloadActiveSessionAndRoles();
    }
    renderAll();
}
