import { translateUiText } from '../core/i18n.js';
import { createAsyncActionButton, buildRoleBadgeContainer } from './role-card-ui.js';

function getUnboundPersons(bootstrapData) {
    return (bootstrapData?.persons || [])
        .filter(person => !person?.legacy_role_id)
        .filter(person => (person?.lifecycle_status || 'active') === 'active');
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
        '未绑定运行时'
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

export function renderUnboundPersonRuntimeBindingSection({
    container,
    bootstrapData,
    personRuntimeActions,
    showToast
}) {
    const bindRuntimeRole = personRuntimeActions?.bindRuntimeRole;
    const generateRuntimeRole = personRuntimeActions?.generateRuntimeRole;
    if (!bindRuntimeRole && !generateRuntimeRole) {
        return false;
    }

    const unboundPersons = getUnboundPersons(bootstrapData);
    if (!unboundPersons.length) {
        return false;
    }

    const runtimeRoles = getRuntimeRoleOptions(bootstrapData);
    if (!runtimeRoles.length && !generateRuntimeRole) {
        return false;
    }

    const section = document.createElement('div');
    section.className = 'team-member-role-section person-runtime-binding-section';

    const header = document.createElement('div');
    header.className = 'team-member-role-section-header';
    const heading = document.createElement('div');
    heading.className = 'team-member-role-section-title';
    heading.textContent = translateUiText(`未绑定长期人物 · ${unboundPersons.length}`);
    const note = document.createElement('div');
    note.className = 'role-manager-tip team-member-role-section-hint';
    note.textContent = translateUiText('绑定后会作为长期人物参与团队和群组运行。');
    header.appendChild(heading);
    header.appendChild(note);
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
    return true;
}
