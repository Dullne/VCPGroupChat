import { createAsyncActionButton } from './role-card-ui.js';

export function buildRoleLibraryImportItemActions(deps) {
    const {
        source,
        item,
        importCatalogRole,
        getImportedRoleIdFromCatalogItem,
        isRoleInManagedProfile,
        removeRoleFromGroup,
        showToast
    } = deps;

    const actions = document.createElement('div');
    actions.className = 'role-card-actions';
    actions.appendChild(
        createAsyncActionButton({
            label: item.imported ? '更新核心档案' : '导入到核心',
            handler: async () => {
                await importCatalogRole(source.id, item.source_item_id);
            },
            variant: item.imported ? 'secondary' : 'primary',
            showToast
        })
    );

    const importedRoleId = getImportedRoleIdFromCatalogItem(item);
    if (item.imported && importedRoleId && isRoleInManagedProfile(importedRoleId)) {
        actions.appendChild(createAsyncActionButton({
            label: '移出当前群组',
            handler: async () => {
                await removeRoleFromGroup(importedRoleId);
            },
            variant: 'secondary',
            showToast
        }));
    } else {
        actions.appendChild(createAsyncActionButton({
            label: '导入并加入当前群组',
            handler: async () => {
                await importCatalogRole(source.id, item.source_item_id, {
                    attachToCurrentProfile: true
                });
            },
            showToast
        }));
    }

    return actions;
}
