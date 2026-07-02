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
    const person = role?.person_identity || {};
    return [
        person.display_name,
        person.description,
        person.personality,
        person.legacy_role_id,
        role?.name,
        role?.id,
        role?.description,
        role?.persona,
        parseRoleTags(role).join(' '),
        role?.source
    ].filter(Boolean).join(' ').toLowerCase();
}

function getRoleName(role) {
    return role?.person_identity?.display_name || role?.name || role?.id || translateUiText('未命名人物');
}

function getRoleDescription(role) {
    return role?.person_identity?.description
        || role?.person_identity?.personality
        || role?.description
        || role?.persona
        || translateUiText('暂无人物描述');
}

function getRuntimeBindingLabel(role) {
    if (role?.runtime_binding_status === 'ready') {
        return '运行时已连接';
    }
    if (role?.runtime_binding_status === 'missing_runtime') {
        return '运行时缺失';
    }
    if (role?.runtime_binding_status === 'unbound_runtime') {
        return '未绑定运行时';
    }
    return null;
}

function canLaunchWithRole(role) {
    return role?.runtime_binding_status === 'ready';
}

function getIdentityBadges(role) {
    const badges = [];
    if (role?.person_identity) {
        badges.push('长期人物', role.person_identity.display_name);
    }
    const runtimeBindingLabel = getRuntimeBindingLabel(role);
    if (runtimeBindingLabel) {
        badges.push(runtimeBindingLabel);
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

function getPersonId(role) {
    if (!role?.person_identity) {
        return '';
    }
    return role.person_identity.id || '';
}

function toggleLauncherRole({
    personId,
    selected,
    getLauncherSelectedPersonIds,
    setLauncherSelectedPersonIds,
    renderAll
}) {
    const next = new Set(getLauncherSelectedPersonIds());
    if (selected) {
        next.delete(personId);
    } else {
        next.add(personId);
    }
    setLauncherSelectedPersonIds(next);
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

function renderSelectedRoleChips({ dom, selectedRoles, setLauncherSelectedPersonIds, renderAll }) {
    if (!dom.launcherSelectedRoles) {
        return;
    }

    dom.launcherSelectedRoles.innerHTML = '';
    if (!selectedRoles.length) {
        dom.launcherSelectedRoles.innerHTML = '<div class="role-empty launcher-selected-empty">还没选择成员。至少选 1 个长期人物才能发起群聊。</div>';
        return;
    }

    for (const role of selectedRoles) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'launcher-selected-chip';
        chip.textContent = `${getRoleName(role)} ×`;
        chip.title = '从本次群聊中移除';
        chip.addEventListener('click', () => {
            const next = new Set(selectedRoles.map(item => getPersonId(item)).filter(Boolean));
            next.delete(getPersonId(role));
            setLauncherSelectedPersonIds(next);
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
    setLauncherSelectedPersonIds,
    getLauncherSelectedPersonIds,
    renderAll
}) {
    const row = document.createElement('div');
    row.className = 'role-card launcher-role-card';
    row.classList.toggle('launcher-role-card-selected', selected);
    row.classList.toggle('launcher-role-card-disabled', !canLaunchWithRole(role));
    row.tabIndex = 0;
    row.setAttribute('role', 'button');
    row.setAttribute('aria-pressed', selected ? 'true' : 'false');
    row.setAttribute('aria-disabled', canLaunchWithRole(role) ? 'false' : 'true');
    row.title = canLaunchWithRole(role)
        ? (selected ? '点击移出本次群聊' : '点击加入本次群聊')
        : '这个人物需要先绑定可用运行时角色';

    const personId = getPersonId(role);
    const toggle = () => toggleLauncherRole({
        personId,
        selected,
        getLauncherSelectedPersonIds,
        setLauncherSelectedPersonIds,
        renderAll
    });
    row.addEventListener('click', () => {
        if (canLaunchWithRole(role)) {
            toggle();
        }
    });
    row.addEventListener('keydown', event => {
        if (!['Enter', ' '].includes(event.key)) {
            return;
        }
        event.preventDefault();
        if (canLaunchWithRole(role)) {
            toggle();
        }
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
    button.disabled = !canLaunchWithRole(role);
    button.textContent = canLaunchWithRole(role)
        ? (selected ? '已选，点击移出' : '加入群聊')
        : '先绑定运行时';
    button.addEventListener('click', event => {
        event.stopPropagation();
        if (canLaunchWithRole(role)) {
            toggle();
        }
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
        getLauncherSelectedPersonIds,
        setLauncherSelectedPersonIds,
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
    const selectedPersonIds = getLauncherSelectedPersonIds();
    const selectedTag = getLauncherRoleTagFilter();
    const keyword = String(getLauncherRoleFilterKeyword() || '').trim().toLowerCase();
    renderTagFilterOptions({ dom, roles, selectedTag });

    const launchableRoles = roles.filter(canLaunchWithRole);
    const selectedRoles = launchableRoles.filter(role => selectedPersonIds.has(getPersonId(role)));
    renderSelectedRoleChips({
        dom,
        selectedRoles,
        setLauncherSelectedPersonIds,
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
        dom.launcherRoleMeta.textContent = launchableRoles.length === 0 && roles.length > 0
            ? `人物通讯录已有 ${roles.length} 个长期人物，但都需要先绑定可用运行时角色后才能开聊。`
            : team
            ? `已选择 ${selectedRoles.length} 个成员。选好后在右侧填写群名，系统会自动准备运行时能力。`
            : `已选择 ${selectedRoles.length} 个成员。选好后在右侧填写群名，系统会自动准备群聊容器。`;
    }

    dom.launcherRoleList.innerHTML = '';
    if (!roles.length) {
        dom.launcherRoleList.innerHTML = '<div class="role-empty">人物通讯录为空，暂时不能发起群聊。</div>';
        return;
    }
    if (!filteredRoles.length) {
        dom.launcherRoleList.innerHTML = '<div class="role-empty">当前筛选条件下没有匹配人物。</div>';
        return;
    }

    for (const [tag, tagRoles] of groupRolesByTag(filteredRoles, selectedTag)) {
        const section = document.createElement('div');
        section.className = 'team-member-role-section launcher-role-section';

        const header = document.createElement('div');
        header.className = 'team-member-role-section-header';
        const heading = document.createElement('div');
        heading.className = 'team-member-role-section-title';
        heading.textContent = translateUiText(`${tag} · ${tagRoles.length}`);
        const hint = document.createElement('div');
        hint.className = 'role-manager-tip team-member-role-section-hint';
        hint.textContent = translateUiText('运行时已连接的人物可直接加入；缺失或未绑定的人物需要先绑定运行时能力。');
        header.appendChild(heading);
        header.appendChild(hint);
        section.appendChild(header);

        for (const role of tagRoles) {
            section.appendChild(createLauncherRoleCard({
                role,
                bootstrapData,
                selected: selectedPersonIds.has(getPersonId(role)),
                isRoleInManagedTeam,
                setLauncherSelectedPersonIds,
                getLauncherSelectedPersonIds,
                renderAll
            }));
        }

        dom.launcherRoleList.appendChild(section);
    }
}
