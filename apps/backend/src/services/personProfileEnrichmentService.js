const path = require('path');
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

function normalizeLimit(value, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }
    return Math.floor(parsed);
}

const PROFILE_FIELDS = [
    'description',
    'personality',
    'emotional_style',
    'voice_style'
];

const PRESETS_CONFIG_PATH = path.resolve(__dirname, '../../config/role-profile-presets.json');

function loadPresetsConfig() {
    try {
        return require(PRESETS_CONFIG_PATH);
    } catch (error) {
        console.warn(`[personProfileEnrichmentService] Failed to load presets config: ${error.message}. Using empty presets.`);
        return { presets: [], default_patch: {} };
    }
}

function buildProfilePresets() {
    const config = loadPresetsConfig();
    return (Array.isArray(config.presets) ? config.presets : []).map(entry => ({
        name: String(entry.name || ''),
        match: new RegExp(String(entry.match || '(?!x)x'), entry.match_flags || 'i'),
        patch: entry.patch || {}
    }));
}

function getDefaultProfilePatch() {
    return loadPresetsConfig().default_patch || {};
}

// 延迟初始化，避免启动时缓存 require() 的时机问题
let _profilePresets = null;
let _defaultProfilePatch = null;

function getProfilePresets() {
    if (!_profilePresets) {
        _profilePresets = buildProfilePresets();
    }
    return _profilePresets;
}

function getDefaultPatch() {
    if (!_defaultProfilePatch) {
        _defaultProfilePatch = getDefaultProfilePatch();
    }
    return _defaultProfilePatch;
}

function getPersonSearchText(person) {
    return [
        person?.id,
        person?.display_name,
        person?.legacy_role_id,
        person?.source_template_id
    ].map(normalizeText).join(' ');
}

function createProfilePatch(person, { force = false } = {}) {
    const searchText = getPersonSearchText(person);
    const preset = getProfilePresets().find(item => item.match.test(searchText));
    const fullPatch = preset ? preset.patch : getDefaultPatch();

    return PROFILE_FIELDS.reduce((patch, field) => {
        if (force || !normalizeText(person?.[field])) {
            if (fullPatch[field]) patch[field] = fullPatch[field];
        }
        return patch;
    }, {});
}

function listSparsePersonProfileCandidates({
    persons = [],
    personIds = null,
    force = false
} = {}) {
    const personIdSet = normalizePersonIdSet(personIds);

    return (Array.isArray(persons) ? persons : [])
        .filter(person => normalizeText(person?.id))
        .filter(person => (person?.lifecycle_status || 'active') === 'active')
        .filter(person => !personIdSet || personIdSet.has(person.id))
        .map(person => ({
            person_id: person.id,
            display_name: person.display_name,
            previous_role_id: normalizeText(person.legacy_role_id) || null,
            missing_fields: PROFILE_FIELDS.filter(field => !normalizeText(person?.[field])),
            patch: createProfilePatch(person, { force })
        }))
        .filter(candidate => force || candidate.missing_fields.length)
        .filter(candidate => Object.keys(candidate.patch).length);
}

async function enrichSparsePersonProfiles({
    personIdentityService,
    vcpCoreClient,
    personIds = null,
    dryRun = false,
    force = false,
    syncRuntime = true,
    limit = 25
} = {}) {
    const persons = personIdentityService.listPersons();
    const normalizedLimit = normalizeLimit(limit, 25);
    const candidates = listSparsePersonProfileCandidates({
        persons,
        personIds,
        force
    }).slice(0, normalizedLimit);

    const result = {
        dry_run: dryRun === true,
        force: force === true,
        sync_runtime: syncRuntime !== false,
        candidate_count: candidates.length,
        candidates,
        enriched: [],
        failed: []
    };

    if (dryRun === true) {
        return result;
    }

    for (const candidate of candidates) {
        try {
            const person = personIdentityService.updatePersonProfile(candidate.person_id, candidate.patch);
            let runtimeRole = null;
            if (syncRuntime !== false) {
                const generated = await generatePersonRuntimeRole({
                    personId: candidate.person_id,
                    overrides: candidate.previous_role_id
                        ? { id: candidate.previous_role_id }
                        : {},
                    personIdentityService,
                    vcpCoreClient
                });
                runtimeRole = generated.runtime_role;
            }
            result.enriched.push({
                person,
                runtime_role: runtimeRole,
                patch: candidate.patch,
                missing_fields: candidate.missing_fields
            });
        } catch (error) {
            result.failed.push({
                person_id: candidate.person_id,
                display_name: candidate.display_name,
                previous_role_id: candidate.previous_role_id,
                missing_fields: candidate.missing_fields,
                error: error.message,
                details: error.payload || null
            });
        }
    }

    return result;
}

module.exports = {
    listSparsePersonProfileCandidates,
    enrichSparsePersonProfiles
};
