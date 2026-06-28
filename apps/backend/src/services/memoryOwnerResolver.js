function normalizeText(value) {
    return String(value ?? '').trim();
}

function getPersonPrivateNotebook(person) {
    return normalizeText(
        person?.memory?.privateNotebook
        || person?.memory?.private_notebook
        || person?.private_notebook
        || person?.display_name
    );
}

function resolveMemoryOwner(candidate = {}, context = {}) {
    const scope = normalizeText(candidate.scope || 'shared').toLowerCase() || 'shared';

    if (scope !== 'private') {
        const notebook = normalizeText(candidate.notebook) || '公共';
        return {
            ok: true,
            owner_type: scope === 'project' ? 'project' : 'shared',
            owner_id: notebook,
            notebook
        };
    }

    const targetPersonId = normalizeText(candidate.target_person_id ?? candidate.targetPersonId);
    if (targetPersonId) {
        const person = context.getPerson?.(targetPersonId) || null;
        if (!person) {
            return {
                ok: false,
                code: 'person_not_found',
                message: `person not found: ${targetPersonId}`
            };
        }

        return {
            ok: true,
            owner_type: 'person',
            owner_id: person.id,
            notebook: getPersonPrivateNotebook(person),
            person
        };
    }

    const targetRoleId = normalizeText(candidate.target_role_id ?? candidate.targetRoleId);
    if (targetRoleId) {
        const legacyPerson = context.getPersonByLegacyRoleId?.(targetRoleId) || null;
        if (legacyPerson) {
            return {
                ok: true,
                owner_type: 'person',
                owner_id: legacyPerson.id,
                notebook: getPersonPrivateNotebook(legacyPerson) || normalizeText(candidate.notebook) || targetRoleId,
                person: legacyPerson,
                legacy_role_id: targetRoleId
            };
        }

        const template = context.getRoleTemplate?.(targetRoleId) || null;
        const source = normalizeText(candidate.target_role_source || template?.source).toLowerCase();
        if (source === 'agency_agents') {
            return {
                ok: false,
                code: 'template_requires_person',
                message: 'private memory for an agency role template requires selecting or creating a person'
            };
        }
    }

    const notebook = normalizeText(candidate.notebook);
    if (notebook) {
        return {
            ok: true,
            owner_type: 'legacy_role',
            owner_id: targetRoleId || notebook,
            notebook,
            legacy_role_id: targetRoleId || null
        };
    }

    return {
        ok: false,
        code: 'private_owner_required',
        message: 'private memory candidate requires target_person_id or a resolvable legacy role owner'
    };
}

module.exports = {
    getPersonPrivateNotebook,
    resolveMemoryOwner
};
