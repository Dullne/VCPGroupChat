function findPersonForRole(role, bootstrapData) {
    const persons = bootstrapData?.persons || [];
    return persons.find(person => person?.legacy_role_id === role?.id)
        || persons.find(person => person?.id === role?.person_id)
        || null;
}

function findTemplateForRole(role, person, bootstrapData) {
    const roleTemplates = bootstrapData?.role_templates || bootstrapData?.roleTemplates || [];
    const sourceTemplateId = person?.source_template_id || role?.source_template_id;
    return roleTemplates.find(template => sourceTemplateId && template?.id === sourceTemplateId)
        || roleTemplates.find(template => template?.external_id === role?.id)
        || null;
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
    return (bootstrapData?.roles || [])
        .filter(role => role.source !== 'ephemeral')
        .map(role => enrichWorkspaceRoleIdentity(role, bootstrapData))
        .sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id), 'zh-Hans-CN'));
}
