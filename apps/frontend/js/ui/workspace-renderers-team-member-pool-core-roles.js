function findPersonForRole(role, bootstrapData) {
    const persons = bootstrapData?.persons || [];
    return persons.find(person => person?.legacy_role_id === role?.id)
        || persons.find(person => person?.id === role?.person_id)
        || null;
}

function normalizeText(value) {
    return String(value ?? '').trim();
}

function getRuntimeRoles(bootstrapData) {
    return (bootstrapData?.roles || [])
        .filter(role => role?.id)
        .filter(role => role.source !== 'ephemeral');
}

function findTemplateForRole(role, person, bootstrapData) {
    const roleTemplates = bootstrapData?.role_templates || bootstrapData?.roleTemplates || [];
    const sourceTemplateId = person?.source_template_id || role?.source_template_id;
    return roleTemplates.find(template => sourceTemplateId && template?.id === sourceTemplateId)
        || roleTemplates.find(template => template?.external_id === role?.id)
        || null;
}

function getRuntimeBindingStatus(person, runtimeRole) {
    if (runtimeRole) {
        return 'ready';
    }
    return normalizeText(person?.legacy_role_id)
        ? 'missing_runtime'
        : 'unbound_runtime';
}

function createPersonCandidate(person, bootstrapData) {
    const runtimeRoleId = normalizeText(person?.legacy_role_id);
    const runtimeRole = runtimeRoleId
        ? getRuntimeRoles(bootstrapData).find(role => role.id === runtimeRoleId) || null
        : null;
    const template = findTemplateForRole(runtimeRole || {}, person, bootstrapData);
    const runtimeStatus = getRuntimeBindingStatus(person, runtimeRole);
    const baseRole = runtimeRole || {
        id: runtimeRoleId || person.id,
        name: person.display_name || person.id,
        source: 'person',
        description: person.description || person.personality || '',
        tag: person.tag || '',
        active: true,
        details_loaded: false
    };

    return {
        ...baseRole,
        id: baseRole.id || runtimeRoleId || person.id,
        name: person.display_name || baseRole.name || person.id,
        description: person.description || baseRole.description || person.personality || '',
        person_id: person.id,
        identity_kind: 'person',
        source_template_id: person.source_template_id || baseRole.source_template_id || template?.id || null,
        person_identity: person,
        role_template_identity: template,
        runtime_role: runtimeRole,
        runtime_binding_status: runtimeStatus
    };
}

export function enrichWorkspaceRoleIdentity(role, bootstrapData) {
    const person = findPersonForRole(role, bootstrapData);
    const template = findTemplateForRole(role, person, bootstrapData);
    return {
        ...role,
        person_identity: person,
        role_template_identity: template,
        identity_kind: person ? 'person' : 'role_template',
        source_template_id: person?.source_template_id || role?.source_template_id || template?.id || null
    };
}

export function getWorkspaceTeamMemberPoolCoreRoles(bootstrapData) {
    return (bootstrapData?.persons || [])
        .filter(person => person?.lifecycle_status !== 'archived')
        .map(person => createPersonCandidate(person, bootstrapData))
        .sort((a, b) => String(a.person_identity?.display_name || a.name || a.id)
            .localeCompare(String(b.person_identity?.display_name || b.name || b.id), 'zh-Hans-CN'));
}
