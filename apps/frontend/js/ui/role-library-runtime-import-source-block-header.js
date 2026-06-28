import { updateCollapsedImportSourceState } from './role-library-runtime-import-sources-state.js';

export function createRoleLibraryImportSourceBlockHeader(deps) {
    const {
        block,
        list,
        source,
        originalItemCount,
        isCollapsed
    } = deps;

    const header = document.createElement('div');
    header.className = 'import-source-header';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'import-source-title-wrap';

    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'collapse-toggle';
    collapseBtn.setAttribute('aria-expanded', !isCollapsed);
    collapseBtn.innerHTML = '<svg class="collapse-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>';

    const title = document.createElement('div');
    title.className = 'import-source-title';
    title.textContent = source.name;

    const meta = document.createElement('div');
    meta.className = 'import-source-meta';
    meta.textContent = source.available
        ? `${source.items.length}/${originalItemCount ?? source.items.length} 个角色`
        : '未挂载';

    titleWrap.appendChild(collapseBtn);
    titleWrap.appendChild(title);
    titleWrap.appendChild(meta);
    header.appendChild(titleWrap);

    header.addEventListener('click', () => {
        const currentCollapsed = list.dataset.collapsed === 'true';
        const nextCollapsed = !currentCollapsed;
        list.dataset.collapsed = nextCollapsed;
        collapseBtn.setAttribute('aria-expanded', currentCollapsed);
        updateCollapsedImportSourceState(source.id, nextCollapsed);
    });

    block.appendChild(header);
}
