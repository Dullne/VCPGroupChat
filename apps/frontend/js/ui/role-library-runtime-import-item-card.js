import { buildRoleBadgeContainer } from './role-card-ui.js';
import { buildRoleLibraryImportItemBadges } from './role-library-runtime-import-item-badges.js';
import { parseRoleLibraryTags } from './role-library-runtime-filters.js';
import { translateUiText } from '../core/i18n.js';

export function createRoleLibraryImportItemCard(deps) {
    const {
        source,
        item,
        isRoleInManagedTeam,
        isRoleInManagedProfile
    } = deps;

    const card = document.createElement('div');
    card.className = 'role-card';
    card.dataset.templateSource = item.source || source.id;

    const titleRow = document.createElement('div');
    titleRow.className = 'role-card-title-row';

    const titleNode = document.createElement('div');
    titleNode.className = 'role-card-title';
    titleNode.textContent = item.name;

    titleRow.appendChild(titleNode);
    titleRow.appendChild(buildRoleBadgeContainer(buildRoleLibraryImportItemBadges(item, {
        isRoleInManagedTeam,
        isRoleInManagedProfile
    })));

    const description = document.createElement('div');
    description.className = 'role-card-description';
    description.textContent = item.description || item.preview || translateUiText('暂无描述');

    const metaRow = document.createElement('div');
    metaRow.className = 'role-card-meta';
    const tags = parseRoleLibraryTags(item);
    metaRow.innerHTML = `<span class="role-meta-item">来源 ${source.name}</span>`;
    if (tags.length) {
        metaRow.innerHTML += `<span class="role-meta-item">标签 ${tags.slice(0, 3).join(' / ')}</span>`;
    }
    if (item.model) {
        metaRow.innerHTML += `<span class="role-meta-item">模型 ${item.model}</span>`;
    }

    card.appendChild(titleRow);
    card.appendChild(description);
    card.appendChild(metaRow);
    return card;
}
