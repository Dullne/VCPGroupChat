const {
    generatePersonRuntimeRole
} = require('./personRuntimeRoleGenerationService');

function normalizeText(value) {
    return String(value ?? '').trim();
}

function normalizePersonIdSet(personIds) {
    if (!Array.isArray(personIds)) {
        return null;
    }

    const ids = personIds
        .map(personId => normalizeText(personId))
        .filter(Boolean);
    return ids.length ? new Set(ids) : null;
}

function createRuntimeRoleIdSet(runtimeRoles = []) {
    return new Set(
        (Array.isArray(runtimeRoles) ? runtimeRoles : [])
            .map(role => normalizeText(role?.id))
            .filter(Boolean)
    );
}

function createRepairCandidate(person, runtimeRoleIds) {
    const previousRoleId = normalizeText(person?.legacy_role_id);
    if (!previousRoleId) {
        return {
            person_id: person.id,
            display_name: person.display_name,
            previous_role_id: null,
            reason: 'runtime_unbound'
        };
    }
    if (!runtimeRoleIds.has(previousRoleId)) {
        return {
            person_id: person.id,
            display_name: person.display_name,
            previous_role_id: previousRoleId,
            reason: 'runtime_missing'
        };
    }
    return null;
}

function listPersonRuntimeRepairCandidates({
    persons = [],
    runtimeRoles = [],
    personIds = null
} = {}) {
    const runtimeRoleIds = createRuntimeRoleIdSet(runtimeRoles);
    const personIdSet = normalizePersonIdSet(personIds);

    return (Array.isArray(persons) ? persons : [])
        .filter(person => normalizeText(person?.id))
        .filter(person => (person?.lifecycle_status || 'active') === 'active')
        .filter(person => !personIdSet || personIdSet.has(person.id))
        .map(person => createRepairCandidate(person, runtimeRoleIds))
        .filter(Boolean);
}

function normalizeLimit(value, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }
    return Math.floor(parsed);
}

async function repairMissingPersonRuntimeRoles({
    personIdentityService,
    vcpCoreClient,
    personIds = null,
    dryRun = false,
    limit = 25
} = {}) {
    const persons = personIdentityService.listPersons();
    const runtimeRoles = await vcpCoreClient.listRoles();
    const normalizedLimit = normalizeLimit(limit, 25);
    const candidates = listPersonRuntimeRepairCandidates({
        persons,
        runtimeRoles,
        personIds
    }).slice(0, normalizedLimit);

    const result = {
        dry_run: dryRun === true,
        runtime_role_count: runtimeRoles.length,
        candidate_count: candidates.length,
        candidates,
        repaired: [],
        failed: []
    };

    if (dryRun === true) {
        return result;
    }

    for (const candidate of candidates) {
        try {
            const generated = await generatePersonRuntimeRole({
                personId: candidate.person_id,
                overrides: candidate.previous_role_id
                    ? { id: candidate.previous_role_id }
                    : {},
                personIdentityService,
                vcpCoreClient
            });
            result.repaired.push(generated);
        } catch (error) {
            result.failed.push({
                person_id: candidate.person_id,
                display_name: candidate.display_name,
                previous_role_id: candidate.previous_role_id,
                reason: candidate.reason,
                error: error.message,
                details: error.payload || null
            });
        }
    }

    return result;
}

module.exports = {
    listPersonRuntimeRepairCandidates,
    repairMissingPersonRuntimeRoles
};
