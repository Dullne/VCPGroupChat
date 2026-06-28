export function createSyncRoleDraftFromFormAction(deps) {
    const {
        readRoleDraftFromForm,
        setLatestRoleDraft,
        hasMeaningfulRoleDraft,
        normalizeRoleDraft,
        getLatestRoleDraft,
        defaultSharedNotebook,
        renderRoleStudio
    } = deps;

    return function syncRoleDraftFromForm() {
        const draft = readRoleDraftFromForm();
        setLatestRoleDraft(
            hasMeaningfulRoleDraft(draft)
                ? normalizeRoleDraft({
                    ...(getLatestRoleDraft() || {}),
                    ...draft
                }, draft.description || draft.name || '', {
                    defaultSharedNotebook
                })
                : null
        );
        renderRoleStudio();
    };
}
