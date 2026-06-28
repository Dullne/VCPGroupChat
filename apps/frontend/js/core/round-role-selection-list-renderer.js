import { buildBadgeContainer } from './round-role-selection-dom.js';

export function createRoundRoleSelectionListRenderer(deps) {
    const {
        getDom,
        getSelectableRoles,
        getSelectedIncludeRoleIds,
        isRoleInSessionProfile,
        clearLatestSelectionTrace,
        getRenderRoleSelectionSummary
    } = deps;

    return function renderRoleSelectionList() {
        const dom = getDom();
        const selectedIncludeRoleIds = getSelectedIncludeRoleIds();
        dom.roleSelectionList.innerHTML = '';

        const selectableRoles = getSelectableRoles();
        if (!selectableRoles.length) {
            dom.roleSelectionList.innerHTML = '<div class="role-empty">当前会话没有可选角色。</div>';
            getRenderRoleSelectionSummary()(selectableRoles);
            return;
        }

        for (const role of selectableRoles) {
            const item = document.createElement('label');
            item.className = 'role-selection-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = selectedIncludeRoleIds.has(role.id);
            checkbox.addEventListener('change', () => {
                clearLatestSelectionTrace();
                if (checkbox.checked) {
                    selectedIncludeRoleIds.add(role.id);
                } else {
                    selectedIncludeRoleIds.delete(role.id);
                }
                getRenderRoleSelectionSummary()(selectableRoles);
            });

            const content = document.createElement('div');
            content.className = 'role-selection-content';

            const title = document.createElement('div');
            title.className = 'role-selection-title';
            title.textContent = role.name;

            const badges = buildBadgeContainer([
                role.source === 'ephemeral' ? '临时角色' : '核心角色',
                isRoleInSessionProfile(role.id) ? '群组成员' : '仅点名'
            ]);

            content.appendChild(title);
            content.appendChild(badges);
            item.appendChild(checkbox);
            item.appendChild(content);
            dom.roleSelectionList.appendChild(item);
        }

        getRenderRoleSelectionSummary()(selectableRoles);
    };
}
