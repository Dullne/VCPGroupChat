export function bindRoleStudioEvents(deps) {
    const {
        dom,
        draftRoleIdeaIntoForm,
        selectRoleStudioEngine,
        searchRoleStudioReferences,
        renderRoleStudioSources,
        setSelectedRoleStudioModel,
        roleStudioStorageKey,
        renderRoleStudio,
        setSelectedRoleRuntimeModel,
        roleRuntimeStorageKey,
        applyRuntimeModelToDraft,
        clearRoleIdeaDraft,
        createEphemeralRole,
        saveRoleDraft,
        getAdvancedRoleEditorExpanded,
        setAdvancedRoleEditorExpanded,
        syncRoleDraftFromForm
    } = deps;

    let roleStudioSearchTimer = null;

    dom.roleIdeaForm.addEventListener('submit', async event => {
        event.preventDefault();
        await draftRoleIdeaIntoForm();
    });

    dom.roleStudioEngineSelect.addEventListener('change', event => {
        selectRoleStudioEngine(event.target.value);
    });

    dom.roleStudioReferenceSearch.addEventListener('input', () => {
        clearTimeout(roleStudioSearchTimer);
        roleStudioSearchTimer = setTimeout(async () => {
            try {
                await searchRoleStudioReferences();
            } catch (error) {
                console.error(error);
            }
        }, 350);
    });

    dom.roleStudioReferenceSearch.addEventListener('keydown', async event => {
        if (event.key !== 'Enter') {
            return;
        }
        event.preventDefault();
        clearTimeout(roleStudioSearchTimer);
        await searchRoleStudioReferences();
        renderRoleStudioSources();
    });

    dom.roleIdeaModelSelect.addEventListener('change', event => {
        const value = String(event.target.value || '').trim();
        setSelectedRoleStudioModel(value);
        localStorage.setItem(roleStudioStorageKey, value);
        renderRoleStudio();
    });

    dom.roleRuntimeModelSelect.addEventListener('change', event => {
        const value = String(event.target.value || '').trim();
        setSelectedRoleRuntimeModel(value);
        localStorage.setItem(roleRuntimeStorageKey, value);
        applyRuntimeModelToDraft(value, { persistPreference: false });
    });

    dom.clearRoleIdeaBtn.addEventListener('click', () => {
        clearRoleIdeaDraft();
    });

    dom.createRoleFromDraftBtn.addEventListener('click', async () => {
        await createEphemeralRole();
    });

    dom.saveRoleDraftBtn.addEventListener('click', async () => {
        await saveRoleDraft('library');
    });

    dom.saveRoleDraftTeamBtn.addEventListener('click', async () => {
        await saveRoleDraft('team');
    });

    dom.saveRoleDraftGroupBtn.addEventListener('click', async () => {
        await saveRoleDraft('group');
    });

    dom.toggleAdvancedRoleFormBtn.addEventListener('click', () => {
        setAdvancedRoleEditorExpanded(!getAdvancedRoleEditorExpanded());
        renderRoleStudio();
    });

    dom.ephemeralRoleForm.addEventListener('input', () => {
        syncRoleDraftFromForm();
    });

    dom.ephemeralRoleForm.addEventListener('submit', async event => {
        event.preventDefault();
        await createEphemeralRole();
    });
}
