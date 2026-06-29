export function bindTeamAndSessionEvents(deps) {
    const {
        dom,
        createTeamFromForm,
        startTeamDraft,
        copyDefaultTeamMembersToDraft,
        setTeamFilterKeyword,
        renderRoleManager,
        updateManagedTeamFromForm,
        deleteManagedTeam,
        setSelectedProfileId,
        getProfileById,
        resolveManagedTeamId,
        setSelectedTeamId,
        switchSession,
        setLauncherRoleFilterKeyword,
        setLauncherRoleTagFilter,
        clearLauncherSelectedRoleIds
    } = deps;

    dom.teamForm.addEventListener('submit', async event => {
        event.preventDefault();
        await createTeamFromForm();
    });

    if (dom.startTeamDraftBtn) {
        dom.startTeamDraftBtn.addEventListener('click', () => {
            startTeamDraft();
        });
    }

    if (dom.copyDefaultTeamMembersBtn) {
        dom.copyDefaultTeamMembersBtn.addEventListener('click', () => {
            copyDefaultTeamMembersToDraft();
        });
    }

    dom.teamSearch.addEventListener('input', event => {
        setTeamFilterKeyword(String(event.target.value || '').trim().toLowerCase());
        renderRoleManager();
    });

    if (dom.teamMemberSearch) {
        dom.teamMemberSearch.addEventListener('input', () => {
            renderRoleManager();
        });
    }

    if (dom.teamMemberTagFilter) {
        dom.teamMemberTagFilter.addEventListener('change', () => {
            renderRoleManager();
        });
    }

    if (dom.launcherRoleSearch) {
        dom.launcherRoleSearch.addEventListener('input', event => {
            setLauncherRoleFilterKeyword(String(event.target.value || '').trim().toLowerCase());
            renderRoleManager();
        });
    }

    if (dom.launcherRoleTagFilter) {
        dom.launcherRoleTagFilter.addEventListener('change', event => {
            setLauncherRoleTagFilter(String(event.target.value || '').trim());
            renderRoleManager();
        });
    }

    if (dom.launcherRoleClearBtn) {
        dom.launcherRoleClearBtn.addEventListener('click', () => {
            clearLauncherSelectedRoleIds();
            renderRoleManager();
        });
    }

    for (const element of [dom.roleLibrarySearch, dom.roleLibrarySourceFilter, dom.roleLibraryStatusFilter].filter(Boolean)) {
        const eventName = element.tagName === 'SELECT' ? 'change' : 'input';
        element.addEventListener(eventName, () => {
            renderRoleManager();
        });
    }

    dom.updateTeamBtn.addEventListener('click', async () => {
        await updateManagedTeamFromForm();
    });

    dom.deleteTeamBtn.addEventListener('click', async () => {
        await deleteManagedTeam();
    });

    dom.profileSelect.addEventListener('change', event => {
        const profileId = event.target.value || null;
        setSelectedProfileId(profileId);
        const profile = getProfileById(profileId);
        if (profile?.team_id) {
            setSelectedTeamId(resolveManagedTeamId(profile.team_id));
        }
        renderRoleManager();
    });

    dom.sessionSelect.addEventListener('change', async event => {
        const sessionId = event.target.value;
        if (!sessionId) {
            return;
        }
        await switchSession(sessionId);
    });
}
