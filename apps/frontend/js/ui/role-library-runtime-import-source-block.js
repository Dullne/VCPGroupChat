import { createRoleLibraryImportSourceBlockHeader } from './role-library-runtime-import-source-block-header.js';
import { createRoleLibraryImportSourceItemsList } from './role-library-runtime-import-source-block-list.js';

export function createRoleLibraryImportSourceBlock(deps) {
    const {
        source,
        originalItemCount,
        isCollapsed,
        isRoleInManagedTeam,
        isRoleInManagedProfile
    } = deps;

    const block = document.createElement('div');
    block.className = 'import-source-block';
    block.dataset.sourceId = source.id;

    const list = createRoleLibraryImportSourceItemsList({
        source,
        originalItemCount,
        isCollapsed,
        isRoleInManagedTeam,
        isRoleInManagedProfile
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
