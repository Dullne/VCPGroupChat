function toRoleSummary(role = {}) {
    const summary = {
        id: role.id || '',
        name: role.name || '',
        source: role.source || '',
        description: role.description || role.role_spec?.description || '',
        avatar: role.avatar || '',
        tag: role.tag || role.role_spec?.tag || '',
        active: role.active ?? true,
        model: role.model || role.role_spec?.model || '',
        temperature: role.temperature ?? role.role_spec?.temperature ?? null,
        max_tokens: role.max_tokens ?? role.role_spec?.max_tokens ?? null,
        output_tokens: role.output_tokens ?? role.role_spec?.output_tokens ?? null,
        context_token_limit: role.context_token_limit ?? role.role_spec?.context_token_limit ?? null,
        responsibilities: Array.isArray(role.responsibilities)
            ? role.responsibilities
            : (Array.isArray(role.role_spec?.responsibilities) ? role.role_spec.responsibilities : []),
        metadata: role.metadata || {},
        is_native: Boolean(role.is_native),
        details_loaded: false
    };

    if (role.promoted_core_role_id) {
        summary.promoted_core_role_id = role.promoted_core_role_id;
    }

    return summary;
}

function normalizeText(value) {
    return String(value ?? '').trim();
}

function toPersonIdentity(person) {
    if (!person) {
        return null;
    }
    return {
        id: person.id,
        display_name: person.display_name,
        legacy_role_id: person.legacy_role_id || null,
        source_template_id: person.source_template_id || null,
        identity_kind: person.identity_kind || 'person'
    };
}

function toTemplateIdentity(template) {
    if (!template) {
        return null;
    }
    return {
        id: template.id,
        name: template.name,
        source: template.source,
        external_id: template.external_id || null
    };
}

function buildIdentityContext(options = {}) {
    const persons = Array.isArray(options.persons) ? options.persons : [];
    const templates = Array.isArray(options.roleTemplates || options.role_templates)
        ? (options.roleTemplates || options.role_templates)
        : [];
    const personByLegacyRoleId = new Map();
    for (const person of persons) {
        const legacyRoleId = normalizeText(person?.legacy_role_id);
        if (!legacyRoleId) {
            continue;
        }
        const existing = personByLegacyRoleId.get(legacyRoleId);
        if (!existing || existing.identity_kind === 'legacy_person') {
            personByLegacyRoleId.set(legacyRoleId, person);
        }
    }

    return {
        personByLegacyRoleId,
        templateById: new Map(
            templates
                .filter(template => normalizeText(template?.id))
                .map(template => [normalizeText(template.id), template])
        )
    };
}

function attachIdentityContext(summary, context) {
    const person = context.personByLegacyRoleId.get(normalizeText(summary.id));
    if (!person) {
        return summary;
    }

    const template = person.source_template_id
        ? context.templateById.get(normalizeText(person.source_template_id))
        : null;

    return {
        ...summary,
        identity_kind: person.identity_kind || 'person',
        source_template_id: person.source_template_id || null,
        person_identity: toPersonIdentity(person),
        ...(template ? { role_template_identity: toTemplateIdentity(template) } : {})
    };
}

function toRoleSummaries(roles = [], options = {}) {
    if (!Array.isArray(roles)) {
        return [];
    }
    const context = buildIdentityContext(options);
    return roles.map(role => attachIdentityContext(toRoleSummary(role), context));
}

module.exports = {
    toRoleSummary,
    toRoleSummaries
};
