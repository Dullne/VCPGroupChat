export function createRoleLibraryImportNewProfileAction(deps) {
    const {
        getManagedProfile,
        getDom,
        getManagedTeamId,
        getCatalogItem,
        setActiveSession,
        fetchJson,
        showToast,
        refreshBootstrap,
        refreshImportSources,
        refreshSessionsList,
        reloadActiveSessionAndRoles,
        renderAll
    } = deps;

    return async function importCatalogRoleToNewProfile(sourceId, sourceItemId) {
        const sourceItem = getCatalogItem(sourceId, sourceItemId);
        const currentProfile = getManagedProfile();
        const suggestedName = currentProfile
            ? `${currentProfile.name}-${sourceItem?.name || '扩展组'}`
            : `${sourceItem?.name || '新角色'}协作组`;
        const profileName = window.prompt('请输入新群组名称', suggestedName);
        if (!profileName || !profileName.trim()) {
            return;
        }

        const result = await fetchJson(`/api/import-sources/${encodeURIComponent(sourceId)}/import`, {
            method: 'POST',
            body: {
                ids: [sourceItemId],
                create_profile: {
                    name: profileName.trim(),
                    team_id: getManagedTeamId(),
                    clone_from_profile_id: currentProfile?.id || undefined
                },
                activate_session: true
            }
        });

        const dom = getDom();
        await refreshBootstrap(result.profile?.id || dom.profileSelect.value);
        await refreshImportSources();
        await refreshSessionsList();

        if (result.session) {
            setActiveSession(result.session);
            await reloadActiveSessionAndRoles();
            dom.sessionSelect.value = result.session.id;
        }

        renderAll();
        showToast(`已导入并创建新群组：${result.profile?.name || profileName.trim()}`, 'success');
    };
}
