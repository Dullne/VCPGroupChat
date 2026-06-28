export function createRoleLibraryImportCurrentAction(deps) {
    const {
        getManagedProfile,
        getDom,
        fetchJson,
        showToast,
        refreshBootstrap,
        refreshImportSources,
        reloadActiveSessionAndRoles,
        renderAll,
        getActiveSession
    } = deps;

    return async function importCatalogRole(sourceId, sourceItemId, { attachToCurrentProfile = false } = {}) {
        const payload = {
            ids: [sourceItemId]
        };

        if (attachToCurrentProfile) {
            const profile = getManagedProfile();
            if (!profile) {
                showToast('当前没有可用群聊配置', 'warning');
                return;
            }
            payload.attach_profile_id = profile.id;
        }

        const result = await fetchJson(`/api/import-sources/${encodeURIComponent(sourceId)}/import`, {
            method: 'POST',
            body: payload
        });

        const activeSession = getActiveSession();
        const dom = getDom();
        await refreshBootstrap(activeSession?.profile_id || dom.profileSelect.value);
        await refreshImportSources();
        await reloadActiveSessionAndRoles();
        renderAll();

        const importedNames = (result.roles || []).map(role => role.name).filter(Boolean);
        if (importedNames.length) {
            showToast(
                attachToCurrentProfile
                    ? `已导入并加入群组：${importedNames.join('、')}`
                    : `已导入到核心：${importedNames.join('、')}`,
                'success'
            );
        }
    };
}
