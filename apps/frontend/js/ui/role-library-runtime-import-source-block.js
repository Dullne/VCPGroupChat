import { createRoleLibraryImportSourceBlockHeader } from './role-library-runtime-import-source-block-header.js';
import { createRoleLibraryImportSourceItemsList } from './role-library-runtime-import-source-block-list.js';

export function createRoleLibraryImportSourceBlock(deps) {
    const {
        source,
        originalItemCount,
        isCollapsed,
        importCatalogRole,
        getImportedRoleIdFromCatalogItem,
        isRoleInManagedTeam,
        isRoleInManagedProfile,
        removeRoleFromGroup,
        showToast
    } = deps;

    const block = document.createElement('div');
    block.className = 'import-source-block';
    block.dataset.sourceId = source.id;

    const list = createRoleLibraryImportSourceItemsList({
        source,
        originalItemCount,
        isCollapsed,
        importCatalogRole,
        getImportedRoleIdFromCatalogItem,
        isRoleInManagedTeam,
        isRoleInManagedProfile,
        removeRoleFromGroup,
        showToast
    });
    createRoleLibraryImportSourceBlockHeader({
        block,
        list,
        source,
        originalItemCount,
        isCollapsed
    });

    block.appendChild(list);
    return block;
}
