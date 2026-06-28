import { buildRoleBadgeContainer } from './role-card-ui.js';
import { getWorkspaceTeamMemberPoolCoreRoles } from './workspace-renderers-team-member-pool-core-roles.js';
import { formatRoleRuntimeModelBadge, getRoleRuntimeModelStatus } from '../core/model-preferences.js';
import { translateUiText } from '../core/i18n.js';

function parseRoleTags(role) {
    return String(role?.tag || '')
        .split(/[，,]/)
        .map(item => item.trim())
        .filter(Boolean);
}

function buildRoleSearchText(role) {
    return [
        role?.name,
        role?.id,
        role?.description,
        role?.persona,
        parseRoleTags(role).join(' '),
        role?.source
    ].filter(Boolean).join(' ').toLowerCase();
}

function getRoleName(role) {
    return role?.person_identity?.display_name || role?.name || role?.id || translateUiText('未命名角色');
}

function getRoleDescription(role) {
    return role?.description || role?.persona || translateUiText('暂无角色描述');
}

function getIdentityBadges(role) {
    const badges = [];
    if (role?.person_identity) {
        badges.push('长期人物', role.person_identity.display_name);
    }
    if (role?.role_template_identity || role?.source === 'agency_agents') {
        badges.push('模板来源');
    }
    if (!badges.length) {
        badges.push('兼容角色');
    }
    return badges;
}

function getRoleInitial(role) {
    return getRoleName(role).trim().slice(0, 2) || 'AI';
}

function toggleLauncherRole({
    roleId,
    selected,
    getLauncherSelectedRoleIds,
    setLauncherSelectedRoleIds,
    renderAll
}) {
    const next = new Set(getLauncherSelectedRoleIds());
    if (selected) {
        next.delete(roleId);
    } else {
        next.add(roleId);
    }
    setLauncherSelectedRoleIds(next);
    renderAll();
}

function renderTagFilterOptions({ dom, roles, selectedTag }) {
    if (!dom.launcherRoleTagFilter) {
        return;
    }

    const tags = [...new Set(roles.flatMap(role => parseRoleTags(role)))]
        .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
    dom.launcherRoleTagFilter.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '全部标签';
    dom.launcherRoleTagFilter.appendChild(defaultOption);
    for (const tag of tags) {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        dom.launcherRoleTagFilter.appendChild(option);
    }
    if (selectedTag && tags.includes(selectedTag)) {
        dom.launcherRoleTagFilter.value = selectedTag;
    }
}

function renderSelectedRoleChips({ dom, selectedRoles, setLauncherSelectedRoleIds, renderAll }) {
    if (!dom.launcherSelectedRoles) {
        return;
    }

    dom.launcherSelectedRoles.innerHTML = '';
    if (!selectedRoles.length) {
        dom.launcherSelectedRoles.innerHTML = '<div class="role-empty launcher-selected-empty">还没选择成员。至少选 1 个 AI 成员才能发起群聊。</div>';
        return;
    }

    for (const role of selectedRoles) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'launcher-selected-chip';
        chip.textContent = `${getRoleName(role)} ×`;
        chip.title = '从本次群聊中移除';
        chip.addEventListener('click', () => {
            const next = new Set(selectedRoles.map(item => item.id));
            next.delete(role.id);
            setLauncherSelectedRoleIds(next);
            renderAll();
        });
        dom.launcherSelectedRoles.appendChild(chip);
    }
}

function createLauncherRoleCard({
    role,
    bootstrapData,
    selected,
    isRoleInManagedTeam,
    setLauncherSelectedRoleIds,
    getLauncherSelectedRoleIds,
    renderAll
}) {
    const row = document.createElement('div');
    row.className = 'role-card launcher-role-card';
    row.classList.toggle('launcher-role-card-selected', selected);
    row.tabIndex = 0;
    row.setAttribute('role', 'button');
    row.setAttribute('aria-pressed', selected ? 'true' : 'false');
    row.title = selected ? '点击移出本次群聊' : '点击加入本次群聊';

    const toggle = () => toggleLauncherRole({
        roleId: role.id,
        selected,
        getLauncherSelectedRoleIds,
        setLauncherSelectedRoleIds,
        renderAll
    });
    row.addEventListener('click', toggle);
    row.addEventListener('keydown', event => {
        if (!['Enter', ' '].includes(event.key)) {
            return;
        }
        event.preventDefault();
        toggle();
    });

    const avatar = document.createElement('div');
    avatar.className = 'launcher-role-avatar';
    avatar.textContent = getRoleInitial(role);

    const body = document.createElement('div');
    body.className = 'launcher-role-body';

    const titleRow = document.createElement('div');
    titleRow.className = 'role-card-title-row launcher-role-title-row';
    const title = document.createElement('div');
    title.className = 'role-card-title';
    title.textContent = getRoleName(role);
    titleRow.appendChild(title);
    const tags = parseRoleTags(role);
    const runtimeModelStatus = getRoleRuntimeModelStatus(role, bootstrapData);
    titleRow.appendChild(buildRoleBadgeContainer([
        selected ? '已选' : '可选',
        ...getIdentityBadges(role),
        tags[0],
        role.source === 'promptx' ? 'PromptX' : role.source === 'agency_agents' ? 'agency' : role.is_native ? '核心' : '自定义',
        runtimeModelStatus.model ? formatRoleRuntimeModelBadge(role, bootstrapData) : null,
        runtimeModelStatus.disabled ? '运行时回退' : null
    ]));

    const desc = document.createElement('div');
    desc.className = 'role-card-description';
    desc.textContent = getRoleDescription(role);

    const actions = document.createElement('div');
    actions.className = 'role-card-actions';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = selected
        ? 'role-action-btn role-action-secondary'
        : 'role-action-btn role-action-primary';
    button.textContent = selected ? '已选，点击移出' : '加入群聊';
    button.addEventListener('click', event => {
        event.stopPropagation();
        toggle();
    });
    actions.appendChild(button);

    body.appendChild(titleRow);
    body.appendChild(desc);
    body.appendChild(actions);
    row.appendChild(avatar);
    row.appendChild(body);
    return row;
}

function groupRolesByTag(roles, selectedTag) {
    const groups = new Map();
    for (const role of roles) {
        const tags = parseRoleTags(role);
        const groupName = selectedTag || tags[0] || '未分组';
        if (!groups.has(groupName)) {
            groups.set(groupName, []);
        }
        groups.get(groupName).push(role);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0], 'zh-Hans-CN'));
}

export function renderWorkspaceLauncherRolePicker(deps) {
    const {
        getDom,
        getWorkspaceMode,
        getBootstrapData,
        getManagedTeam,
        isRoleInManagedTeam,
        getLauncherSelectedRoleIds,
        setLauncherSelectedRoleIds,
        getLauncherRoleFilterKeyword,
        getLauncherRoleTagFilter,
        renderAll
    } = deps;

    const dom = getDom();
    if (!dom.launcherRoleList) {
        return;
    }

    const isLauncherMode = getWorkspaceMode() === 'launcher';
    if (!isLauncherMode) {
        dom.launcherRoleList.innerHTML = '';
        dom.launcherSelectedRoles.innerHTML = '';
        if (dom.launcherRoleMeta) {
            dom.launcherRoleMeta.textContent = '';
        }
        return;
    }

    const bootstrapData = getBootstrapData();
    const roles = getWorkspaceTeamMemberPoolCoreRoles(bootstrapData);
    const selectedRoleIds = getLauncherSelectedRoleIds();
    const selectedTag = getLauncherRoleTagFilter();
    const keyword = String(getLauncherRoleFilterKeyword() || '').trim().toLowerCase();
    renderTagFilterOptions({ dom, roles, selectedTag });

    const selectedRoles = roles.filter(role => selectedRoleIds.has(role.id));
    renderSelectedRoleChips({
        dom,
        selectedRoles,
        setLauncherSelectedRoleIds,
        renderAll
    });

    const filteredRoles = roles.filter(role => {
        if (selectedTag && !parseRoleTags(role).includes(selectedTag)) {
            return false;
        }
        if (!keyword) {
            return true;
        }
        return buildRoleSearchText(role).includes(keyword);
    });

    const team = getManagedTeam();
    if (dom.launcherRoleMeta) {
        dom.launcherRoleMeta.textContent = team
            ? `已选择 ${selectedRoles.length} 个成员。选好后在右侧填写群名，系统会自动处理底层角色池。`
            : `已选择 ${selectedRoles.length} 个成员。选好后在右侧填写群名，系统会自动准备群聊容器。`;
    }

    dom.launcherRoleList.innerHTML = '';
    if (!roles.length) {
        dom.launcherRoleList.innerHTML = '<div class="role-empty">角色库为空，暂时不能发起群聊。</div>';
        return;
    }
    if (!filteredRoles.length) {
        dom.launcherRoleList.innerHTML = '<div class="role-empty">当前筛选条件下没有匹配角色。</div>';
        return;
    }

    for (const [tag, tagRoles] of groupRolesByTag(filteredRoles, selectedTag)) {
        const section = document.createElement('div');
        section.className = 'team-member-role-section launcher-role-section';

        const header = document.createElement('div');
        header.className = 'team-member-role-section-header';
        const heading = document.createElement('div');
        heading.className = 'team-member-role-section-title';
        heading.textContent = `${tag} · ${tagRoles.length}`;
        const hint = document.createElement('div');
        hint.className = 'role-manager-tip team-member-role-section-hint';
        hint.textContent = '点击卡片即可把成员加入或移出本次群聊。';
        header.appendChild(heading);
        header.appendChild(hint);
        section.appendChild(header);

        for (const role of tagRoles) {
            section.appendChild(createLauncherRoleCard({
                role,
                bootstrapData,
                selected: selectedRoleIds.has(role.id),
                isRoleInManagedTeam,
                setLauncherSelectedRoleIds,
                getLauncherSelectedRoleIds,
                renderAll
            }));
        }

        dom.launcherRoleList.appendChild(section);
    }
}
