import { createRoleLibraryImportItemCard } from './role-library-runtime-import-item-card.js';

export function createRoleLibraryImportSourceItemsList(deps) {
    const {
        source,
        isCollapsed,
        isRoleInManagedTeam,
        isRoleInManagedProfile
    } = deps;

    const list = document.createElement('div');
    list.className = 'import-source-items';
    list.dataset.collapsed = isCollapsed;

    if (!source.available) {
        list.innerHTML = '<div class="role-empty">当前不可用，请检查核心容器是否已挂载外部目录。</div>';
        return list;
    }
    if (!source.items.length) {
        list.innerHTML = '<div class="role-empty">当前没有可参考模板。</div>';
        return list;
    }

    for (const item of source.items) {
        list.appendChild(createRoleLibraryImportItemCard({
            source,
            item,
            isRoleInManagedTeam,
            isRoleInManagedProfile
        }));
    }
    return list;
}
