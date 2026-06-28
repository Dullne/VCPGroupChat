export function buildRoleLibraryCatalogGetter(getExternalImportSources) {
    return function getCatalogItem(sourceId, sourceItemId) {
        const source = getExternalImportSources().find(item => item.id === sourceId);
        return source?.items?.find(item => item.source_item_id === sourceItemId) || null;
    };
}
