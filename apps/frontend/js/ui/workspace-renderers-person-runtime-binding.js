import { translateUiText } from '../core/i18n.js';
import { createAsyncActionButton, buildRoleBadgeContainer } from './role-card-ui.js';

function getPersonsNeedingRuntimeBinding(bootstrapData) {
    const runtimeRoleIds = new Set(
        (bootstrapData?.roles || [])
            .filter(role => role?.id)
            .filter(role => role.source !== 'ephemeral')
            .map(role => String(role.id).trim())
    );

    return (bootstrapData?.persons || [])
        .filter(person => (person?.lifecycle_status || 'active') === 'active')
        .filter(person => {
            const legacyRoleId = String(person?.legacy_role_id || '').trim();
            return !legacyRoleId || !runtimeRoleIds.has(legacyRoleId);
        });
}

const PROFILE_FIELDS = [
    'description',
    'personality',
    'emotional_style',
    'voice_style'
];

function getPersonsNeedingProfileEnrichment(bootstrapData) {
    return (bootstrapData?.persons || [])
        .filter(person => (person?.lifecycle_status || 'active') === 'active')
        .filter(person => PROFILE_FIELDS.some(field => !String(person?.[field] || '').trim()));
}

function getRuntimeRoleOptions(bootstrapData) {
    const boundRoleIds = new Set(
        (bootstrapData?.persons || [])
            .map(person => String(person?.legacy_role_id || '').trim())
            .filter(Boolean)
    );

    return (bootstrapData?.roles || [])
        .filter(role => role?.id)
        .filter(role => role.source !== 'ephemeral')
        .filter(role => !boundRoleIds.has(role.id))
        .sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id), 'zh-Hans-CN'));
}

function createRuntimeRoleSelect(runtimeRoles) {
    const select = document.createElement('select');
    select.className = 'runtime-role-select';

    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = translateUiText('选择运行时角色');
    select.appendChild(emptyOption);

    for (const role of runtimeRoles) {
        const option = document.createElement('option');
        option.value = role.id;
        option.textContent = role.name ? `${role.name} · ${role.id}` : role.id;
        select.appendChild(option);
    }

    return select;
}

function getBindingStatusBadge(person, runtimeRoles) {
    const legacyRoleId = String(person?.legacy_role_id || '').trim();
    if (!legacyRoleId) {
        return '未绑定运行时';
    }
    return runtimeRoles.some(role => role.id === legacyRoleId)
        ? '运行时已连接'
        : '运行时缺失';
}

function createUnboundPersonCard({
    person,
    runtimeRoles,
    personRuntimeActions,
    showToast
}) {
    const bindRuntimeRole = personRuntimeActions?.bindRuntimeRole;
    const generateRuntimeRole = personRuntimeActions?.generateRuntimeRole;
    const row = document.createElement('div');
    row.className = 'role-card';
    row.classList.add('person-runtime-binding-card');

    const titleRow = document.createElement('div');
    titleRow.className = 'role-card-title-row';
    const title = document.createElement('div');
    title.className = 'role-card-title';
    title.textContent = person.display_name || person.id;
    titleRow.appendChild(title);
    titleRow.appendChild(buildRoleBadgeContainer([
        '长期人物',
        getBindingStatusBadge(person, runtimeRoles)
    ]));

    const desc = document.createElement('div');
    desc.className = 'role-card-description';
    desc.textContent = person.description || person.personality || translateUiText('需要先绑定运行时角色');

    const actions = document.createElement('div');
    actions.className = 'role-card-actions';
    if (bindRuntimeRole && runtimeRoles.length) {
        const select = createRuntimeRoleSelect(runtimeRoles);
        actions.appendChild(select);
        actions.appendChild(createAsyncActionButton({
            label: '绑定运行时角色',
            variant: 'secondary',
            showToast,
            handler: async () => {
                const roleId = select.value;
                if (!roleId) {
                    showToast('请选择运行时角色', 'warning');
                    return;
                }
                await bindRuntimeRole(person.id, roleId);
            }
        }));
    }
    if (generateRuntimeRole) {
        actions.appendChild(createAsyncActionButton({
            label: '生成运行时角色',
            variant: 'primary',
            showToast,
            handler: async () => {
                await generateRuntimeRole(person.id);
            }
        }));
    }

    row.appendChild(titleRow);
    row.appendChild(desc);
    row.appendChild(actions);
    return row;
}

function createSparseProfileCard({
    person,
    personRuntimeActions,
    showToast
}) {
    const enrichSparseProfiles = personRuntimeActions?.enrichSparseProfiles;
    const row = document.createElement('div');
    row.className = 'role-card';
    row.classList.add('person-runtime-binding-card');

    const titleRow = document.createElement('div');
    titleRow.className = 'role-card-title-row';
    const title = document.createElement('div');
    title.className = 'role-card-title';
    title.textContent = person.display_name || person.id;
    titleRow.appendChild(title);
    titleRow.appendChild(buildRoleBadgeContainer([
        '长期人物',
        '档案较薄'
    ]));

    const desc = document.createElement('div');
    desc.className = 'role-card-description';
    desc.textContent = person.description || person.personality || translateUiText('缺少人物定位、性格或表达风格');

    const actions = document.createElement('div');
    actions.className = 'role-card-actions';
    if (enrichSparseProfiles) {
        actions.appendChild(createAsyncActionButton({
            label: translateUiText('补全档案'),
            variant: 'secondary',
            showToast,
            handler: async () => {
                await enrichSparseProfiles([person.id]);
            }
        }));
    }

    row.appendChild(titleRow);
    row.appendChild(desc);
    row.appendChild(actions);
    return row;
}

function appendSparseProfileEnrichmentSection({
    container,
    sparseProfilePersons,
    personRuntimeActions,
    showToast
}) {
    const enrichSparseProfiles = personRuntimeActions?.enrichSparseProfiles;
    if (!enrichSparseProfiles || !sparseProfilePersons.length) {
        return false;
    }

    const section = document.createElement('div');
    section.className = 'team-member-role-section person-runtime-binding-section';

    const header = document.createElement('div');
    header.className = 'team-member-role-section-header';
    const heading = document.createElement('div');
    heading.className = 'team-member-role-section-title';
    heading.textContent = translateUiText(`待补全人物档案 · ${sparseProfilePersons.length}`);
    const note = document.createElement('div');
    note.className = 'role-manager-tip team-member-role-section-hint';
    note.textContent = translateUiText('这些长期人物已有身份，但缺少可用于群聊发言的性格、情绪或表达档案。');
    header.appendChild(heading);
    header.appendChild(note);

    const headerActions = document.createElement('div');
    headerActions.className = 'role-card-actions';
    headerActions.appendChild(createAsyncActionButton({
        label: translateUiText('一键补全人物档案'),
        variant: 'primary',
        showToast,
        handler: async () => {
            await enrichSparseProfiles(sparseProfilePersons.map(person => person.id));
        }
    }));
    header.appendChild(headerActions);
    section.appendChild(header);

    for (const person of sparseProfilePersons) {
        section.appendChild(createSparseProfileCard({
            person,
            personRuntimeActions,
            showToast
        }));
    }

    container.appendChild(section);
    return true;
}

export function renderUnboundPersonRuntimeBindingSection({
    container,
    bootstrapData,
    personRuntimeActions,
    showToast
}) {
    const bindRuntimeRole = personRuntimeActions?.bindRuntimeRole;
    const generateRuntimeRole = personRuntimeActions?.generateRuntimeRole;
    const repairMissingRuntimeRoles = personRuntimeActions?.repairMissingRuntimeRoles;
    const enrichSparseProfiles = personRuntimeActions?.enrichSparseProfiles;
    if (!bindRuntimeRole && !generateRuntimeRole && !repairMissingRuntimeRoles && !enrichSparseProfiles) {
        return false;
    }

    const unboundPersons = getPersonsNeedingRuntimeBinding(bootstrapData);
    const sparseProfilePersons = getPersonsNeedingProfileEnrichment(bootstrapData);
    if (!unboundPersons.length && !sparseProfilePersons.length) {
        return false;
    }

    const runtimeRoles = getRuntimeRoleOptions(bootstrapData);
    let rendered = appendSparseProfileEnrichmentSection({
        container,
        sparseProfilePersons,
        personRuntimeActions,
        showToast
    });

    if (!unboundPersons.length) {
        return rendered;
    }

    if (!runtimeRoles.length && !generateRuntimeRole && !repairMissingRuntimeRoles) {
        return rendered;
    }

    const section = document.createElement('div');
    section.className = 'team-member-role-section person-runtime-binding-section';

    const header = document.createElement('div');
    header.className = 'team-member-role-section-header';
    const heading = document.createElement('div');
    heading.className = 'team-member-role-section-title';
    heading.textContent = translateUiText(`待绑定运行时人物 · ${unboundPersons.length}`);
    const note = document.createElement('div');
    note.className = 'role-manager-tip team-member-role-section-hint';
    note.textContent = translateUiText('这些长期人物缺少可用运行时角色；绑定或生成后才能上场发言。');
    header.appendChild(heading);
    header.appendChild(note);
    if (repairMissingRuntimeRoles) {
        const headerActions = document.createElement('div');
        headerActions.className = 'role-card-actions';
        headerActions.appendChild(createAsyncActionButton({
            label: translateUiText('一键生成缺失运行时'),
            variant: 'primary',
            showToast,
            handler: async () => {
                await repairMissingRuntimeRoles(unboundPersons.map(person => person.id));
            }
        }));
        header.appendChild(headerActions);
    }
    section.appendChild(header);

    for (const person of unboundPersons) {
        section.appendChild(createUnboundPersonCard({
            person,
            runtimeRoles,
            personRuntimeActions,
            showToast
        }));
    }

    container.appendChild(section);
    rendered = true;
    return rendered;
}
