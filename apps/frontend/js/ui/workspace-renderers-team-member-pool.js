import { createWorkspaceTeamMemberCard } from './workspace-renderers-team-member-card.js';
import { getWorkspaceTeamMemberPoolCoreRoles } from './workspace-renderers-team-member-pool-core-roles.js';
import { renderUnboundPersonRuntimeBindingSection } from './workspace-renderers-person-runtime-binding.js';

function parseRoleTags(role) {
    return String(role?.tag || '')
        .split(/[，,]/)
        .map(item => item.trim())
        .filter(Boolean);
}

function buildRoleSearchText(role) {
    const tags = parseRoleTags(role).join(' ');
    return [
        role?.name,
        role?.id,
        role?.description,
        role?.persona,
        tags,
        role?.source
    ].filter(Boolean).join(' ').toLowerCase();
}

function getSelectedTag(dom) {
    return String(dom.teamMemberTagFilter?.value || '').trim();
}

function getKeyword(dom) {
    return String(dom.teamMemberSearch?.value || '').trim().toLowerCase();
}

function renderTagFilterOptions(dom, roles) {
    if (!dom.teamMemberTagFilter) {
        return;
    }

    const previous = getSelectedTag(dom);
    const tags = [...new Set(
        roles.flatMap(role => parseRoleTags(role))
    )].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));

    const options = ['<option value="">全部标签</option>', ...tags.map(tag => (
        `<option value="${tag}">${tag}</option>`
    ))];
    dom.teamMemberTagFilter.innerHTML = options.join('');

    if (previous && tags.includes(previous)) {
        dom.teamMemberTagFilter.value = previous;
    }
}

function groupRolesByTag(roles, selectedTag) {
    const groups = new Map();

    for (const role of roles) {
        const tags = parseRoleTags(role);
        const groupTag = selectedTag || tags[0] || '未分组';
        if (!groups.has(groupTag)) {
            groups.set(groupTag, []);
        }
        groups.get(groupTag).push(role);
    }

    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0], 'zh-Hans-CN'));
}

function renderRoleSection({
    container,
    title,
    hint,
    roles,
    bootstrapData,
    selectedTag,
    isRoleInManagedTeam,
    addRoleToTeam,
    removeRoleFromTeam,
    selectedLabel = '已在团队',
    availableLabel = '未进团队',
    addLabel = '加入这个团队',
    removeLabel = '移出团队',
    showToast
}) {
    const section = document.createElement('div');
    section.className = 'team-member-role-section';

    const header = document.createElement('div');
    header.className = 'team-member-role-section-header';
    const heading = document.createElement('div');
    heading.className = 'team-member-role-section-title';
    heading.textContent = `${title} · ${roles.length}`;
    const note = document.createElement('div');
    note.className = 'role-manager-tip team-member-role-section-hint';
    note.textContent = hint;
    header.appendChild(heading);
    header.appendChild(note);
    section.appendChild(header);

    for (const [tag, tagRoles] of groupRolesByTag(roles, selectedTag)) {
        const group = document.createElement('div');
        group.className = 'role-section-group';

        const groupHeader = document.createElement('div');
        groupHeader.className = 'role-manager-tip';
        groupHeader.textContent = `${tag} · ${tagRoles.length} 个角色`;
        group.appendChild(groupHeader);

        for (const role of tagRoles) {
            group.appendChild(createWorkspaceTeamMemberCard({
                role,
                bootstrapData,
                isRoleInManagedTeam,
                addRoleToTeam,
                removeRoleFromTeam,
                selectedLabel,
                availableLabel,
                addLabel,
                removeLabel,
                showToast
            }));
        }

        section.appendChild(group);
    }

    container.appendChild(section);
}

export function renderWorkspaceTeamMemberPool(deps) {
    const {
        getDom,
        getManagedTeam,
        getBootstrapData,
        getTeamDraftMode,
        getTeamDraftSelectedRoleIds,
        isRoleInManagedTeam,
        addRoleToTeam,
        removeRoleFromTeam,
        addRoleToTeamDraft,
        removeRoleFromTeamDraft,
        personRuntimeActions,
        showToast
    } = deps;

    const dom = getDom();
    if (!dom.teamMemberPoolList) {
        return;
    }

    const team = getManagedTeam();
    const bootstrapData = getBootstrapData();
    const draftMode = getTeamDraftMode?.() === true;
    dom.teamMemberPoolList.innerHTML = '';

    const coreRoles = getWorkspaceTeamMemberPoolCoreRoles(bootstrapData);
    renderTagFilterOptions(dom, coreRoles);

    if (!team && !draftMode) {
        dom.teamMemberPoolMeta.textContent = '请先选择团队。';
        dom.teamMemberPoolList.innerHTML = '<div class="role-empty">未选择团队。</div>';
        return;
    }

    if (!coreRoles.length) {
        dom.teamMemberPoolMeta.textContent = draftMode
            ? '团队草稿：当前没有可选角色。'
            : `当前团队：${team.name}。`;
        const renderedUnboundPersons = renderUnboundPersonRuntimeBindingSection({
            container: dom.teamMemberPoolList,
            bootstrapData,
            personRuntimeActions,
            showToast
        });
        if (!renderedUnboundPersons) {
            dom.teamMemberPoolList.innerHTML = '<div class="role-empty">核心角色为空，无法配置团队成员。</div>';
        }
        return;
    }

    const keyword = getKeyword(dom);
    const selectedTag = getSelectedTag(dom);
    const filteredRoles = coreRoles.filter(role => {
        if (selectedTag && !parseRoleTags(role).includes(selectedTag)) {
            return false;
        }
        if (!keyword) {
            return true;
        }
        return buildRoleSearchText(role).includes(keyword);
    });

    const inTeamCount = coreRoles.filter(role => isRoleInManagedTeam(role.id)).length;
    dom.teamMemberPoolMeta.textContent = selectedTag
        ? `当前团队：${team.name}。已加入 ${inTeamCount} 个角色，可选 ${coreRoles.length} 个；当前标签：${selectedTag}。`
        : `当前团队：${team.name}。已加入 ${inTeamCount} 个角色，可按标签或关键词筛选后加入。`;

    if (!filteredRoles.length) {
        dom.teamMemberPoolList.innerHTML = '<div class="role-empty">当前筛选条件下没有匹配角色。</div>';
        return;
    }

    if (draftMode) {
        const selectedRoleIds = getTeamDraftSelectedRoleIds?.() || new Set();
        const isRoleInTeamDraft = roleId => selectedRoleIds.has(roleId);
        const selectedCount = coreRoles.filter(role => isRoleInTeamDraft(role.id)).length;
        const rolesSelected = filteredRoles.filter(role => isRoleInTeamDraft(role.id));
        const rolesAvailable = filteredRoles.filter(role => !isRoleInTeamDraft(role.id));

        dom.teamMemberPoolMeta.textContent = selectedTag
            ? `团队草稿：已选 ${selectedCount} 个成员，可选 ${coreRoles.length} 个；当前标签：${selectedTag}。`
            : `团队草稿：已选 ${selectedCount} 个成员，先选人再创建团队。`;

        renderUnboundPersonRuntimeBindingSection({
            container: dom.teamMemberPoolList,
            bootstrapData,
            personRuntimeActions,
            showToast
        });

        if (rolesSelected.length) {
            renderRoleSection({
                container: dom.teamMemberPoolList,
                title: '已选成员',
                hint: '这些成员会随新团队一起创建，可在提交前继续移出或补充。',
                roles: rolesSelected,
                bootstrapData,
                selectedTag,
                isRoleInManagedTeam: isRoleInTeamDraft,
                addRoleToTeam: addRoleToTeamDraft,
                removeRoleFromTeam: removeRoleFromTeamDraft,
                selectedLabel: '已选',
                availableLabel: '可选',
                addLabel: '加入草稿',
                removeLabel: '移出草稿',
                showToast
            });
        }

        if (rolesAvailable.length) {
            renderRoleSection({
                container: dom.teamMemberPoolList,
                title: '可加入成员',
                hint: '点击“加入草稿”，先把成员放进新团队草稿。',
                roles: rolesAvailable,
                bootstrapData,
                selectedTag,
                isRoleInManagedTeam: isRoleInTeamDraft,
                addRoleToTeam: addRoleToTeamDraft,
                removeRoleFromTeam: removeRoleFromTeamDraft,
                selectedLabel: '已选',
                availableLabel: '可选',
                addLabel: '加入草稿',
                removeLabel: '移出草稿',
                showToast
            });
        }

        if (!rolesSelected.length && !rolesAvailable.length) {
            dom.teamMemberPoolList.innerHTML = '<div class="role-empty">当前筛选条件下没有可显示的角色。</div>';
        }
        return;
    }

    const rolesInTeam = filteredRoles.filter(role => isRoleInManagedTeam(role.id));
    const rolesAvailable = filteredRoles.filter(role => !isRoleInManagedTeam(role.id));

    renderUnboundPersonRuntimeBindingSection({
        container: dom.teamMemberPoolList,
        bootstrapData,
        personRuntimeActions,
        showToast
    });

    if (rolesInTeam.length) {
        renderRoleSection({
            container: dom.teamMemberPoolList,
            title: '已在这个团队',
            hint: '这些角色已经是团队成员，可以继续从下方补人，或移出团队。',
            roles: rolesInTeam,
            bootstrapData,
            selectedTag,
            isRoleInManagedTeam,
            addRoleToTeam,
            removeRoleFromTeam,
            showToast
        });
    }

    if (rolesAvailable.length) {
        renderRoleSection({
            container: dom.teamMemberPoolList,
            title: '可加入的角色',
            hint: '点击“加入这个团队”，把角色放进当前团队成员池。',
            roles: rolesAvailable,
            bootstrapData,
            selectedTag,
            isRoleInManagedTeam,
            addRoleToTeam,
            removeRoleFromTeam,
            showToast
        });
    }

    if (!rolesInTeam.length && !rolesAvailable.length) {
        dom.teamMemberPoolList.innerHTML = '<div class="role-empty">当前筛选条件下没有可显示的角色。</div>';
    }
}
