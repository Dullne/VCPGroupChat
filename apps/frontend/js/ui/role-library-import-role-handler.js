export function buildLegacyRoleImportHandler(deps) {
    const {
        fetchJson,
        loadSessionRoles
    } = deps;

    return async function importRole(sourceId, itemId) {
        try {
            await fetchJson('/api/group-chat/import-role', {
                method: 'POST',
                body: JSON.stringify({ source_id: sourceId, item_id: itemId })
            });
            await loadSessionRoles();
        } catch (error) {
            console.error('导入角色失败:', error);
        }
    };
}
