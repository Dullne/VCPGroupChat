import { readCollapsedImportSourcesState } from './role-library-runtime-import-sources-state.js';
import { createRoleLibraryImportSourceBlock } from './role-library-runtime-import-source-block.js';
import {
    readRoleLibraryFilters,
    matchesRoleLibraryImportSource
} from './role-library-runtime-filters.js';

export function renderRoleLibraryImportSourceList(deps) {
    const {
        getDom,
        getExternalImportSources,
        isRoleInManagedTeam,
        isRoleInManagedProfile
    } = deps;

    const dom = getDom();
    const externalImportSources = getExternalImportSources();
    dom.importSourceList.innerHTML = '';
    const filters = readRoleLibraryFilters(dom);

    if (!externalImportSources.length) {
        dom.importSourceList.innerHTML = '<div class="role-empty">当前没有可用的外部模板目录。</div>';
        return;
    }

    const collapsedSources = readCollapsedImportSourcesState();

    for (const source of externalImportSources) {
        const filteredItems = (source.items || []).filter(item => matchesRoleLibraryImportSource(item, filters, {
            source,
            isRoleInManagedProfile,
            isRoleInManagedTeam
        }));
        if ((source.items || []).length && !filteredItems.length && (filters.keyword || filters.source || filters.status)) {
            continue;
        }
        const isCollapsed = collapsedSources[source.id] || false;
        dom.importSourceList.appendChild(createRoleLibraryImportSourceBlock({
            source: {
                ...source,
                items: filteredItems
            },
            originalItemCount: source.items?.length || 0,
            isCollapsed,
            isRoleInManagedTeam,
            isRoleInManagedProfile
        }));
    }

    if (!dom.importSourceList.childElementCount) {
        dom.importSourceList.innerHTML = '<div class="role-empty">当前筛选条件下没有匹配的外部角色模板。</div>';
    }
}
