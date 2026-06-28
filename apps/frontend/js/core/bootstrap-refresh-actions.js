export function createBootstrapRefreshActions(deps) {
    const {
        getConfig,
        getDom,
        getBootstrapData,
        setBootstrapData,
        setTeams,
        setPersons,
        setRoleTemplates,
        getSelectedTeamId,
        setSelectedTeamId,
        getSelectedProfileId,
        getActiveSession,
        fetchJson,
        normalizeTeamsFromBootstrap,
        resolveManagedTeamId,
        getProfileById,
        syncRoleStudioModelPreference,
        syncRoleRuntimeModelPreference,
        renderProfileSelectOptions,
        setExternalImportSources
    } = deps;

    async function refreshBootstrap(preferredProfileId = null) {
        const dom = getDom();
        const previousTeamId = getSelectedTeamId();
        const bootstrapData = getBootstrapData();
        const activeSession = getActiveSession();
        const previousProfileId =
            preferredProfileId ||
            getSelectedProfileId() ||
            activeSession?.profile_id ||
            dom.profileSelect.value ||
            bootstrapData?.default_profile_id;

        const nextBootstrapData = await fetchJson('/api/bootstrap');
        let persons = Array.isArray(nextBootstrapData.persons)
            ? nextBootstrapData.persons
            : null;
        let roleTemplates = Array.isArray(nextBootstrapData.role_templates)
            ? nextBootstrapData.role_templates
            : Array.isArray(nextBootstrapData.roleTemplates)
                ? nextBootstrapData.roleTemplates
                : null;

        if (persons === null) {
            try {
                const personPayload = await fetchJson('/api/persons');
                persons = Array.isArray(personPayload.persons) ? personPayload.persons : [];
            } catch (error) {
                persons = [];
            }
        }

        if (roleTemplates === null) {
            try {
                const templatePayload = await fetchJson('/api/role-templates');
                roleTemplates = Array.isArray(templatePayload.templates) ? templatePayload.templates : [];
            } catch (error) {
                roleTemplates = [];
            }
        }

        setBootstrapData(nextBootstrapData);
        setTeams(normalizeTeamsFromBootstrap(nextBootstrapData));
        setPersons?.(persons);
        setRoleTemplates?.(roleTemplates);
        setSelectedTeamId(
            resolveManagedTeamId(
                previousTeamId ||
                getProfileById(previousProfileId)?.team_id ||
                nextBootstrapData?.default_team_id
            )
        );

        syncRoleStudioModelPreference();
        syncRoleRuntimeModelPreference();
        dom.title.textContent = getConfig()?.AppTitle || nextBootstrapData.app_name || 'VCP Group Chat';
        renderProfileSelectOptions(previousProfileId);
    }

    async function refreshImportSources() {
        const data = await fetchJson('/api/import-sources');
        setExternalImportSources(data.sources || []);
    }

    return {
        refreshBootstrap,
        refreshImportSources
    };
}
