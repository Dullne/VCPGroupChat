export async function loadLegacyRoleLibraryImportSources(deps) {
    const {
        state,
        fetchJson,
        renderImportSourceList
    } = deps;

    try {
        const data = await fetchJson('/api/import-sources');
        state.importSources = data.sources || [];
        renderImportSourceList();
    } catch (error) {
        console.error('加载外部角色目录失败:', error);
    }
}

export function renderLegacyRoleLibraryImportSourceList(state) {
    const container = document.getElementById('import-source-list');
    if (!container) {
        return;
    }

    const sources = state.importSources || [];
    if (sources.length === 0) {
        container.innerHTML = '<div class="role-empty">当前没有可用的外部角色目录</div>';
        return;
    }

    container.innerHTML = sources.map(source => `
        <div class="import-source-block">
            <div class="import-source-header">
                <div class="import-source-title">${source.name}</div>
                <div class="import-source-meta">${source.items?.length || 0} 个角色</div>
            </div>
            <div class="import-source-items">
                ${(source.items || []).map(item => `
                    <div class="import-source-item" data-source-id="${source.id}" data-item-id="${item.id}">
                        <div class="import-item-name">${item.name}</div>
                        <button class="import-item-btn" onclick="window.importRole('${source.id}', '${item.id}')">导入</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}
