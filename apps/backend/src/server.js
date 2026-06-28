const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ path: 'config.env' });

const { DEFAULT_TEAM, DEFAULT_PROFILE, getDatabase } = require('./db/database');
const VcpCoreClient = require('./services/vcpCoreClient');
const GroupChatLlmClient = require('./services/groupChatLlmClient');
const SessionService = require('./services/sessionService');
const Orchestrator = require('./services/orchestrator');
const RoleStudioService = require('./services/roleStudioService');
const PersonIdentityService = require('./services/personIdentityService');
const { SessionEventHub } = require('./services/sessionEventHub');
const { buildSessionReflectionDraft: buildSessionReflectionDraftWithRoles } = require('./services/reflectionDraftService');
const { toRoleSummaries } = require('./services/roleSummary');
const { sendGuardedRoleListJson } = require('./services/apiPayloadGuards');
const { generatePersonRuntimeRole } = require('./services/personRuntimeRoleGenerationService');
const { buildGroupProfilePatchPayload } = require('./services/groupProfilePayload');
const { createHttpError } = require('./services/httpError');

const PORT = Number(process.env.PORT || 7010);
const USER_NAME = process.env.GROUPCHAT_USER_NAME || '用户';
const USER_PROMPT = process.env.GROUPCHAT_USER_PROMPT || '用户是当前任务的最终决策者。';

const db = getDatabase();
const sessionService = new SessionService(db);
const vcpCoreClient = new VcpCoreClient();
const groupChatLlmClient = new GroupChatLlmClient();
const sessionEventHub = new SessionEventHub();
const personIdentityService = new PersonIdentityService(db);
const roleStudioService = new RoleStudioService({
    sessionService,
    vcpCoreClient,
    llmClient: groupChatLlmClient
});
const orchestrator = new Orchestrator({
    sessionService,
    vcpCoreClient,
    llmClient: groupChatLlmClient,
    userName: USER_NAME,
    userPrompt: USER_PROMPT
});

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));

function normalizeText(value) {
    return String(value ?? '').trim();
}

function uniqueNonEmpty(values = []) {
    return [...new Set(
        values
            .flatMap(value => String(value || '').split(','))
            .map(item => item.trim())
            .filter(Boolean)
    )];
}

function getGroupChatRuntimeConfig() {
    return {
        llm_provider: groupChatLlmClient.getRuntimeConfig(),
        disabled_models: uniqueNonEmpty([process.env.GROUPCHAT_DISABLED_MODELS]),
        model_failure_cooldown_seconds: Number(process.env.GROUPCHAT_MODEL_FAILURE_COOLDOWN_SECONDS || 300)
    };
}

function buildProjectAssetsHccBridgePayload(synthesis) {
    const synthesisId = normalizeText(synthesis?.id);
    const baseArgs = ['--synthesis', synthesisId];
    return {
        mode: 'host_command_required',
        synthesis_id: synthesisId,
        dry_run_command: `cd GroupChatBackend && npm run project-assets:hcc:dry-run -- ${baseArgs.join(' ')}`,
        create_command: `cd GroupChatBackend && npm run project-assets:hcc:create -- ${baseArgs.join(' ')}`,
        dry_run_args: ['npm', 'run', 'project-assets:hcc:dry-run', '--', ...baseArgs],
        create_args: ['npm', 'run', 'project-assets:hcc:create', '--', ...baseArgs],
        write_guard: 'GROUPCHAT_HCC_CREATE=1',
        note: 'The live backend runs in a container without hcc. Review the dry-run command on the host before running the guarded create command.'
    };
}

function normalizeResponsibilities(value) {
    if (Array.isArray(value)) {
        return value.map(item => normalizeText(item)).filter(Boolean);
    }
    return normalizeText(value)
        .split('\n')
        .map(item => item.trim())
        .filter(Boolean);
}

function normalizeRoleStudioSaveTarget(value) {
    const target = normalizeText(value).toLowerCase();
    if (['group', 'current_group', 'profile'].includes(target)) {
        return 'group';
    }
    if (['team', 'current_team'].includes(target)) {
        return 'team';
    }
    return 'library';
}

function buildRoleStudioImportPayload(body = {}) {
    const draft = body.role || body.draft || {};
    const name = normalizeText(draft.name);
    if (!name) {
        throw createHttpError(400, 'role name is required');
    }

    return {
        id: normalizeText(body.id || draft.id) || undefined,
        name,
        source: normalizeText(body.source || draft.source) || 'role_studio',
        description: normalizeText(draft.description),
        avatar: normalizeText(draft.avatar),
        tag: normalizeText(draft.tag),
        model: normalizeText(draft.model),
        temperature: draft.temperature,
        max_tokens: draft.max_tokens,
        output_tokens: draft.output_tokens,
        context_token_limit: draft.context_token_limit,
        persona: normalizeText(draft.persona),
        responsibilities: normalizeResponsibilities(draft.responsibilities),
        collaboration_guide: normalizeText(draft.collaboration_guide || draft.collaborationGuide),
        voice_style: normalizeText(draft.voice_style || draft.voiceStyle),
        memory: draft.memory || null,
        invite_prompt:
            normalizeText(draft.invite_prompt || draft.invitePrompt)
            || `接下来请作为${name}发言。优先按照你的职责范围回答，不要输出额外聊天标识头。`,
        template_content: normalizeText(draft.template_content || draft.template)
    };
}

function getCandidateCoreFilePath(candidate) {
    const result = candidate?.core_write_result || {};
    return normalizeText(result.file_path || result.index_result?.file_path || result.index_check?.file_path);
}

async function enrichMemoryCandidatesWithCoreIndexStatus(candidates = []) {
    return Promise.all(candidates.map(async candidate => {
        const filePath = getCandidateCoreFilePath(candidate);
        if (!filePath || candidate.status !== 'confirmed' || candidate.core_write_status !== 'written') {
            return candidate;
        }
        try {
            return {
                ...candidate,
                core_index_status: await vcpCoreClient.getMemoryCandidateIndexStatus(filePath)
            };
        } catch (error) {
            return {
                ...candidate,
                core_index_status: {
                    index_status: 'status_failed',
                    indexed: false,
                    error: error.message
                }
            };
        }
    }));
}

async function getSessionMemoryPayload(sessionId) {
    const memoryCandidates = sessionService.listMemoryCandidates(sessionId);
    return {
        reflection: sessionService.getLatestSessionReflection(sessionId),
        round_syntheses: sessionService.listRoundSyntheses(sessionId),
        memory_candidates: await enrichMemoryCandidatesWithCoreIndexStatus(memoryCandidates)
    };
}

async function getMemoryCandidateResponsePayload(sessionId, candidate) {
    const memoryPayload = await getSessionMemoryPayload(sessionId);
    const enrichedCandidate = memoryPayload.memory_candidates.find(item => item.id === candidate?.id) || candidate;
    return {
        candidate: enrichedCandidate,
        ...memoryPayload
    };
}

function buildCoreMemoryCandidatePayload({ session, candidate, confirmedBy }) {
    return {
        candidate_id: candidate.id,
        session_id: session.id,
        reflection_id: candidate.reflection_id,
        scope: candidate.scope,
        target_role_id: candidate.target_role_id,
        target_role_name: candidate.target_role_name,
        target_person_id: candidate.target_person_id,
        target_membership_id: candidate.target_membership_id,
        memory_owner_type: candidate.memory_owner_type,
        memory_owner_id: candidate.memory_owner_id,
        owner_type: candidate.memory_owner_type,
        owner_id: candidate.memory_owner_id,
        notebook: candidate.notebook,
        content: candidate.content,
        reason: candidate.reason,
        confirmed_by: confirmedBy,
        source: 'groupchat'
    };
}

const INDEX_REPAIR_ALLOWED_STATUSES = new Set([
    'not_indexed',
    'pending_vectors',
    'partial_vectors',
    'stale',
    'queued',
    'already_queued',
    'indexed'
]);

function clampInteger(value, fallback, min, max) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }
    return Math.max(min, Math.min(max, parsed));
}

function normalizeBoolean(value, fallback = false) {
    if (typeof value === 'boolean') {
        return value;
    }
    const text = normalizeText(value).toLowerCase();
    if (!text) {
        return fallback;
    }
    if (['1', 'true', 'yes', 'on'].includes(text)) {
        return true;
    }
    if (['0', 'false', 'no', 'off'].includes(text)) {
        return false;
    }
    return fallback;
}

function normalizeStatusList(value) {
    const raw = Array.isArray(value)
        ? value
        : normalizeText(value).split(/[,，]/);
    return raw
        .map(item => normalizeText(item).toLowerCase())
        .filter(item => INDEX_REPAIR_ALLOWED_STATUSES.has(item));
}

function buildMemoryIndexRepairOptions(source = {}, defaults = {}) {
    const limit = clampInteger(source.limit, defaults.limit || 5, 1, defaults.maxLimit || 20);
    const maxScan = clampInteger(source.max_scan ?? source.maxScan, defaults.maxScan || 120, 1, 5000);
    const notebook = normalizeText(source.notebook || source.diary);
    const statuses = normalizeStatusList(source.statuses || source.status);
    const includeIndexed = normalizeBoolean(source.include_indexed ?? source.includeIndexed, false);

    return {
        limit,
        max_scan: maxScan,
        ...(notebook ? { notebook } : {}),
        ...(statuses.length ? { statuses } : {}),
        ...(includeIndexed ? { include_indexed: true } : {})
    };
}

function buildMemoryIndexRepairBatchPayload(source = {}) {
    return {
        ...buildMemoryIndexRepairOptions(source, {
            limit: 1,
            maxScan: 120,
            maxLimit: 20
        }),
        dry_run: normalizeBoolean(source.dry_run ?? source.dryRun, true)
    };
}

app.get('/api/health', async (_req, res) => {
    try {
        const coreHealth = await vcpCoreClient.getHealth();
        res.json({
            ok: true,
            service: 'vcp-groupchat-backend',
            core: coreHealth
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
});

app.get('/api/bootstrap', async (req, res) => {
    try {
        const [roles, profiles, teams] = await Promise.all([
            vcpCoreClient.listRoles(),
            Promise.resolve(sessionService.listProfiles()),
            Promise.resolve(sessionService.listTeams())
        ]);
        const teamMembersByTeamId = sessionService.listTeamMembersByTeamId(teams.map(team => team.id));
        const persons = personIdentityService.listPersons();
        const roleTemplates = personIdentityService.listRoleTemplates();

        const bootstrapPayload = {
            app_name: 'VCPGroupChat',
            user_name: USER_NAME,
            user_prompt: USER_PROMPT,
            default_team_id: DEFAULT_TEAM.id,
            default_profile_id: DEFAULT_PROFILE.id,
            role_studio: roleStudioService.getRuntimeConfig(),
            groupchat_runtime: getGroupChatRuntimeConfig(),
            teams,
            team_members_by_team_id: teamMembersByTeamId,
            persons,
            role_templates: roleTemplates,
            roles: toRoleSummaries(roles, { persons, roleTemplates }),
            profiles
        };

        sendGuardedRoleListJson(req, res, bootstrapPayload, {
            label: '/api/bootstrap'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/roles', async (req, res) => {
    try {
        const sessionId = req.query.session_id;
        const [coreRoles, session] = await Promise.all([
            vcpCoreClient.listRoles(),
            sessionId ? Promise.resolve(sessionService.getSession(sessionId)) : Promise.resolve(null)
        ]);

        const ephemeralRoles = (session?.ephemeral_roles || []).map(role => ({
            id: role.id,
            name: role.name,
            source: 'ephemeral',
            avatar: role.avatar,
            description: role.description,
            active: !role.promoted_core_role_id,
            promoted_core_role_id: role.promoted_core_role_id,
            role_spec: role.role_spec
        }));

        const persons = personIdentityService.listPersons();
        const roleTemplates = personIdentityService.listRoleTemplates();
        const rolesPayload = {
            roles: toRoleSummaries([...coreRoles, ...ephemeralRoles], { persons, roleTemplates })
        };

        sendGuardedRoleListJson(req, res, rolesPayload, {
            label: '/api/roles'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/roles/:id', async (req, res) => {
    try {
        const roleId = normalizeText(req.params.id);
        const sessionId = normalizeText(req.query?.session_id);
        if (!roleId) {
            return res.status(400).json({ error: 'role id is required' });
        }

        if (sessionId) {
            const session = sessionService.getSession(sessionId);
            const ephemeralRole = (session?.ephemeral_roles || []).find(role => role.id === roleId);
            if (ephemeralRole) {
                return res.json({
                    role: {
                        id: ephemeralRole.id,
                        name: ephemeralRole.name,
                        source: 'ephemeral',
                        avatar: ephemeralRole.avatar,
                        description: ephemeralRole.description,
                        active: !ephemeralRole.promoted_core_role_id,
                        promoted_core_role_id: ephemeralRole.promoted_core_role_id,
                        role_spec: ephemeralRole.role_spec,
                        details_loaded: true
                    }
                });
            }
        }

        const role = await vcpCoreClient.getRole(roleId);
        if (!role) {
            return res.status(404).json({ error: 'role not found' });
        }

        res.json({
            role: {
                ...role,
                details_loaded: true
            }
        });
    } catch (error) {
        res.status(error.status || 500).json({
            error: error.message,
            details: error.payload || null
        });
    }
});

app.get('/api/role-templates', (_req, res) => {
    res.json({
        templates: personIdentityService.listRoleTemplates()
    });
});

app.post('/api/role-templates', (req, res) => {
    try {
        const template = personIdentityService.upsertRoleTemplate(req.body || {});
        res.status(201).json({ template });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/persons', (_req, res) => {
    res.json({
        persons: personIdentityService.listPersons()
    });
});

app.post('/api/persons', (req, res) => {
    try {
        const person = personIdentityService.createPerson(req.body || {});
        res.status(201).json({ person });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/persons/from-template', (req, res) => {
    try {
        const templateId = normalizeText(req.body?.template_id || req.body?.templateId);
        if (!templateId) {
            return res.status(400).json({ error: 'template_id is required' });
        }
        const person = personIdentityService.createPersonFromTemplate(templateId, req.body || {});
        res.status(201).json({ person });
    } catch (error) {
        const status = /not found/i.test(error.message) ? 404 : 400;
        res.status(status).json({ error: error.message });
    }
});

app.patch('/api/persons/:id/runtime-role', async (req, res) => {
    try {
        const person = personIdentityService.getPerson(req.params.id);
        if (!person) {
            return res.status(404).json({ error: 'person not found' });
        }

        const roleId = normalizeText(req.body?.role_id || req.body?.roleId);
        if (!roleId) {
            return res.status(400).json({ error: 'role_id is required' });
        }

        const runtimeRole = await vcpCoreClient.getRole(roleId);
        if (!runtimeRole?.id) {
            return res.status(404).json({ error: 'runtime role not found' });
        }

        const updatedPerson = personIdentityService.bindPersonRuntimeRole(person.id, {
            role_id: roleId,
            role_name: runtimeRole.name || person.display_name
        });

        return res.json({
            person: updatedPerson,
            runtime_role: runtimeRole
        });
    } catch (error) {
        res.status(error.status || 400).json({
            error: error.message,
            details: error.payload || null
        });
    }
});

app.post('/api/persons/:id/runtime-role/generate', async (req, res) => {
    try {
        const result = await generatePersonRuntimeRole({
            personId: req.params.id,
            overrides: req.body || {},
            personIdentityService,
            vcpCoreClient
        });
        res.status(201).json(result);
    } catch (error) {
        res.status(error.status || 400).json({
            error: error.message,
            details: error.payload || null
        });
    }
});

function requireRuntimePersonLegacyRole(person) {
    if (!person) {
        throw createHttpError(404, 'person not found');
    }
    if (!person.legacy_role_id) {
        throw createHttpError(
            409,
            'person must be connected to a runtime role before joining a runtime team or group'
        );
    }
    return person.legacy_role_id;
}

app.get('/api/import-sources', async (_req, res) => {
    try {
        const sources = await vcpCoreClient.listImportSources();
        res.json({ sources });
    } catch (error) {
        res.status(error.status || 500).json({
            error: error.message,
            details: error.payload || null
        });
    }
});

app.get('/api/role-studio/sources', async (req, res) => {
    try {
        const result = await roleStudioService.listSources({
            query: req.query?.q || req.query?.query || '',
            limit: req.query?.limit || 30
        });
        res.json(result);
    } catch (error) {
        res.status(error.status || 500).json({
            error: error.message,
            details: error.payload || null
        });
    }
});

app.post('/api/role-studio/draft', async (req, res) => {
    try {
        const result = await roleStudioService.draftRole({
            idea: req.body?.idea,
            sessionId: req.body?.session_id || null,
            profileId: req.body?.profile_id || null,
            preferredModel: req.body?.preferred_model || null,
            engine: req.body?.engine || req.body?.generation_engine || 'vcp_default',
            referenceItemIds:
                req.body?.reference_item_ids
                || req.body?.reference_ids
                || req.body?.source_item_ids
                || [],
            agencyLimit: req.body?.agency_limit || req.body?.reference_limit || 3
        });

        res.json(result);
    } catch (error) {
        res.status(error.status || 500).json({
            error: error.message,
            details: error.payload || null
        });
    }
});

app.post('/api/role-studio/save', async (req, res) => {
    try {
        const target = normalizeRoleStudioSaveTarget(req.body?.target);
        const importedRole = await vcpCoreClient.importRole(buildRoleStudioImportPayload(req.body));
        if (!importedRole?.id) {
            throw createHttpError(502, 'core role import did not return a role id', { role: importedRole });
        }

        let team = null;
        let teamMembers = null;
        let profile = null;

        if (target === 'team') {
            const teamId = normalizeText(req.body?.team_id || req.body?.teamId);
            if (!teamId) {
                throw createHttpError(400, 'team_id is required for target=team');
            }
            team = sessionService.getTeam(teamId);
            if (!team) {
                throw createHttpError(404, 'team not found');
            }
            teamMembers = sessionService.addTeamMember(team.id, importedRole.id, importedRole.name);
        }

        if (target === 'group') {
            const profileId = normalizeText(req.body?.profile_id || req.body?.profileId);
            if (!profileId) {
                throw createHttpError(400, 'profile_id is required for target=group');
            }
            profile = sessionService.addProfileMember(profileId, importedRole.id, importedRole.name);
            team = sessionService.getTeam(profile.team_id);
            teamMembers = sessionService.listTeamMembers(profile.team_id);
        }

        res.status(201).json({
            role: importedRole,
            target,
            team,
            team_members: teamMembers,
            profile
        });
    } catch (error) {
        res.status(error.status || 500).json({
            error: error.message,
            details: error.payload || null
        });
    }
});

app.post('/api/import-sources/:source/import', async (req, res) => {
    try {
        const result = await vcpCoreClient.importFromSource(req.params.source, {
            ids: req.body?.ids || req.body?.source_item_ids || req.body?.sourceItemIds || req.body?.id
        });

        let profile = null;
        const createProfilePayload = req.body?.create_profile;
        if (createProfilePayload?.name) {
            const cloneFromProfileId = createProfilePayload.clone_from_profile_id || null;
            profile = sessionService.createProfile({
                name: createProfilePayload.name,
                team_id: createProfilePayload.team_id,
                description: createProfilePayload.description,
                mode: createProfilePayload.mode,
                invite_prompt: createProfilePayload.invite_prompt,
                mode_options: createProfilePayload.mode_options,
                group_prompt:
                    createProfilePayload.group_prompt != null
                        ? createProfilePayload.group_prompt
                        : (cloneFromProfileId ? undefined : DEFAULT_PROFILE.group_prompt),
                clone_from_profile_id: cloneFromProfileId,
                members: (result.roles || []).map(role => ({
                    role_id: role.id,
                    role_name: role.name
                }))
            });
        } else if (req.body?.attach_profile_id) {
            for (const role of result.roles || []) {
                profile = sessionService.addProfileMember(req.body.attach_profile_id, role.id, role.name);
            }
        }

        if (profile && req.body?.activate_session === true) {
            const session = sessionService.createSession(profile.id, profile.name);
            return res.status(201).json({
                ...result,
                profile,
                session
            });
        }

        res.status(201).json({
            ...result,
            profile
        });
    } catch (error) {
        res.status(error.status || 500).json({
            error: error.message,
            details: error.payload || null
        });
    }
});

app.get('/api/group-profiles', (req, res) => {
    const teamId = String(req.query?.team_id || '').trim();
    res.json({
        profiles: sessionService.listProfiles({
            teamId: teamId || null
        })
    });
});

app.post('/api/group-profiles', (req, res) => {
    try {
        const cloneFromProfileId = req.body?.clone_from_profile_id || null;
        const profile = sessionService.createProfile({
            id: req.body?.id,
            name: req.body?.name,
            team_id: req.body?.team_id,
            description: req.body?.description,
            mode: req.body?.mode,
            invite_prompt: req.body?.invite_prompt,
            mode_options: req.body?.mode_options,
            group_prompt:
                req.body?.group_prompt != null
                    ? req.body.group_prompt
                    : (cloneFromProfileId ? undefined : DEFAULT_PROFILE.group_prompt),
            clone_from_profile_id: cloneFromProfileId,
            members: req.body?.members || []
        });

        res.status(201).json({ profile });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.patch('/api/group-profiles/:id', (req, res) => {
    try {
        const profile = sessionService.updateProfile(
            req.params.id,
            buildGroupProfilePatchPayload(req.body)
        );

        res.json({ profile });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/teams', (_req, res) => {
    res.json({
        teams: sessionService.listTeams()
    });
});

app.post('/api/teams', (req, res) => {
    try {
        const team = sessionService.createTeam({
            id: req.body?.id,
            name: req.body?.name,
            description: req.body?.description
        });
        res.status(201).json({ team });
    } catch (error) {
        const status = /already exists/i.test(error.message) ? 409 : 400;
        res.status(status).json({ error: error.message });
    }
});

app.patch('/api/teams/:id', (req, res) => {
    try {
        const team = sessionService.updateTeam(req.params.id, {
            name: req.body?.name,
            description: req.body?.description
        });
        res.json({ team });
    } catch (error) {
        let status = 400;
        if (/not found/i.test(error.message)) {
            status = 404;
        } else if (/already exists/i.test(error.message)) {
            status = 409;
        }
        res.status(status).json({ error: error.message });
    }
});

app.delete('/api/teams/:id', (req, res) => {
    try {
        const team = sessionService.deleteTeam(req.params.id);
        res.json({ team });
    } catch (error) {
        const status = /not found/i.test(error.message) ? 404 : 400;
        res.status(status).json({ error: error.message });
    }
});

app.get('/api/teams/:id/person-members', (req, res) => {
    const team = sessionService.getTeam(req.params.id);
    if (!team) {
        return res.status(404).json({ error: 'team not found' });
    }

    return res.json({
        team,
        members: personIdentityService.listTeamPersonMembers(team.id)
    });
});

app.post('/api/teams/:id/person-members', (req, res) => {
    try {
        const team = sessionService.getTeam(req.params.id);
        if (!team) {
            return res.status(404).json({ error: 'team not found' });
        }

        const personId = normalizeText(req.body?.person_id || req.body?.personId);
        if (!personId) {
            return res.status(400).json({ error: 'person_id is required' });
        }

        const person = personIdentityService.getPerson(personId);
        const legacyRoleId = requireRuntimePersonLegacyRole(person);
        const members = personIdentityService.addTeamPersonMember(team.id, person.id, {
            person_name: req.body?.person_name || req.body?.personName,
            member_order: req.body?.member_order ?? req.body?.memberOrder,
            legacy_role_id: legacyRoleId,
            legacy_role_name: person.display_name
        });

        return res.status(201).json({
            team,
            members,
            runtime_members: sessionService.listTeamMembers(team.id)
        });
    } catch (error) {
        res.status(error.status || 400).json({
            error: error.message,
            details: error.payload || null
        });
    }
});

app.delete('/api/teams/:id/person-members/:personId', (req, res) => {
    try {
        const team = sessionService.getTeam(req.params.id);
        if (!team) {
            return res.status(404).json({ error: 'team not found' });
        }

        const members = personIdentityService.removeTeamPersonMember(team.id, req.params.personId);
        return res.json({
            team,
            members,
            runtime_members: sessionService.listTeamMembers(team.id)
        });
    } catch (error) {
        res.status(error.status || 400).json({
            error: error.message,
            details: error.payload || null
        });
    }
});

app.get('/api/teams/:id/members', (req, res) => {
    const team = sessionService.getTeam(req.params.id);
    if (!team) {
        return res.status(404).json({ error: 'team not found' });
    }

    return res.json({
        team,
        members: sessionService.listTeamMembers(team.id)
    });
});

app.post('/api/teams/:id/members', async (req, res) => {
    try {
        const team = sessionService.getTeam(req.params.id);
        if (!team) {
            return res.status(404).json({ error: 'team not found' });
        }

        const roleId = req.body?.role_id;
        if (!roleId) {
            return res.status(400).json({ error: 'role_id is required' });
        }

        const coreRole = await vcpCoreClient.getRole(roleId);
        const members = sessionService.addTeamMember(
            team.id,
            roleId,
            req.body?.role_name || coreRole?.name || roleId,
            req.body?.role_order
        );

        return res.status(201).json({
            team,
            members
        });
    } catch (error) {
        res.status(error.status || 400).json({
            error: error.message,
            details: error.payload || null
        });
    }
});

app.delete('/api/teams/:id/members/:roleId', (req, res) => {
    try {
        const team = sessionService.getTeam(req.params.id);
        if (!team) {
            return res.status(404).json({ error: 'team not found' });
        }

        const members = sessionService.removeTeamMember(team.id, req.params.roleId);
        return res.json({
            team,
            members
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/teams/:id/group-profiles', (req, res) => {
    const team = sessionService.getTeam(req.params.id);
    if (!team) {
        return res.status(404).json({ error: 'team not found' });
    }
    res.json({
        team,
        profiles: sessionService.listProfiles({ teamId: req.params.id })
    });
});

app.delete('/api/group-profiles/:id', (req, res) => {
    try {
        const profile = sessionService.deleteProfile(req.params.id);
        res.json({ profile });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/group-profiles/:id/person-members', (req, res) => {
    const profile = sessionService.getProfile(req.params.id);
    if (!profile) {
        return res.status(404).json({ error: 'group profile not found' });
    }

    return res.json({
        profile,
        members: personIdentityService.listGroupPersonMembers(profile.id)
    });
});

app.post('/api/group-profiles/:id/person-members', (req, res) => {
    try {
        const profile = sessionService.getProfile(req.params.id);
        if (!profile) {
            return res.status(404).json({ error: 'group profile not found' });
        }

        const personId = normalizeText(req.body?.person_id || req.body?.personId);
        if (!personId) {
            return res.status(400).json({ error: 'person_id is required' });
        }

        const person = personIdentityService.getPerson(personId);
        const legacyRoleId = requireRuntimePersonLegacyRole(person);
        const members = personIdentityService.addGroupPersonMember(profile.id, person.id, {
            person_name: req.body?.person_name || req.body?.personName,
            group_alias: req.body?.group_alias || req.body?.groupAlias,
            member_order: req.body?.member_order ?? req.body?.memberOrder,
            speaking_policy: req.body?.speaking_policy || req.body?.speakingPolicy,
            legacy_role_id: legacyRoleId,
            legacy_role_name: person.display_name
        });

        return res.status(201).json({
            profile: sessionService.getProfile(profile.id),
            members
        });
    } catch (error) {
        res.status(error.status || 400).json({
            error: error.message,
            details: error.payload || null
        });
    }
});

app.delete('/api/group-profiles/:id/person-members/:personId', (req, res) => {
    try {
        const profile = sessionService.getProfile(req.params.id);
        if (!profile) {
            return res.status(404).json({ error: 'group profile not found' });
        }

        const members = personIdentityService.removeGroupPersonMember(profile.id, req.params.personId);
        return res.json({
            profile: sessionService.getProfile(profile.id),
            members
        });
    } catch (error) {
        res.status(error.status || 400).json({
            error: error.message,
            details: error.payload || null
        });
    }
});

app.post('/api/group-profiles/:id/members', async (req, res) => {
    try {
        const roleId = req.body?.role_id;
        if (!roleId) {
            return res.status(400).json({ error: 'role_id is required' });
        }

        const coreRole = await vcpCoreClient.getRole(roleId);
        const profile = sessionService.addProfileMember(
            req.params.id,
            roleId,
            req.body?.role_name || coreRole?.name || roleId,
            req.body?.role_order
        );

        res.status(201).json({ profile });
    } catch (error) {
        res.status(error.status || 400).json({
            error: error.message,
            details: error.payload || null
        });
    }
});

app.patch('/api/group-profiles/:id/members/:roleId/order', (req, res) => {
    try {
        const profile = sessionService.moveProfileMember(
            req.params.id,
            req.params.roleId,
            String(req.body?.direction || '').trim().toLowerCase()
        );
        res.json({ profile });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/group-profiles/:id/members/:roleId', (req, res) => {
    try {
        const profile = sessionService.removeProfileMember(req.params.id, req.params.roleId);
        res.json({ profile });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/group-chat/sessions', (_req, res) => {
    res.json({
        sessions: sessionService.listSessions()
    });
});

app.get('/api/group-chat/events', (req, res) => {
    sessionEventHub.subscribe(req, res);
});

app.post('/api/group-chat/sessions', (req, res) => {
    try {
        const profileId = req.body?.profile_id || DEFAULT_PROFILE.id;
        const session = sessionService.createSession(profileId, req.body?.title || '');
        sessionEventHub.publish('session_created', {
            session_id: session.id,
            profile_id: session.profile_id,
            session
        });
        res.status(201).json({ session });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/group-chat/sessions/:id', async (req, res) => {
    const session = sessionService.getSession(req.params.id);
    if (!session) {
        return res.status(404).json({ error: 'session not found' });
    }
    res.json({
        session,
        ...await getSessionMemoryPayload(req.params.id)
    });
});

app.get('/api/group-chat/sessions/:id/reflection', async (req, res) => {
    const session = sessionService.getSession(req.params.id);
    if (!session) {
        return res.status(404).json({ error: 'session not found' });
    }
    res.json(await getSessionMemoryPayload(req.params.id));
});

app.get('/api/group-chat/sessions/:id/round-syntheses', (req, res) => {
    const session = sessionService.getSession(req.params.id);
    if (!session) {
        return res.status(404).json({ error: 'session not found' });
    }

    res.json({
        session_id: session.id,
        round_syntheses: sessionService.listRoundSyntheses(session.id)
    });
});

app.post('/api/group-chat/sessions/:id/round-syntheses', (req, res) => {
    try {
        const session = sessionService.getSession(req.params.id);
        if (!session) {
            return res.status(404).json({ error: 'session not found' });
        }

        const synthesis = sessionService.upsertRoundSynthesis(session.id, req.body || {});
        res.status(201).json({
            synthesis,
            round_syntheses: sessionService.listRoundSyntheses(session.id)
        });
    } catch (error) {
        const status = /not found/i.test(error.message) ? 404 : (error.status || 400);
        res.status(status).json({
            error: error.message,
            details: error.payload || null
        });
    }
});

app.post('/api/group-chat/sessions/:id/round-syntheses/:roundIndex/project-assets/hcc/confirm', (req, res) => {
    try {
        const session = sessionService.getSession(req.params.id);
        if (!session) {
            return res.status(404).json({ error: 'session not found' });
        }

        const confirmedBy = normalizeText(req.body?.confirmed_by) || USER_NAME;
        const synthesis = sessionService.confirmRoundSynthesisProjectAssets(
            session.id,
            req.params.roundIndex,
            {
                confirmedBy
            }
        );
        res.json({
            synthesis,
            round_syntheses: sessionService.listRoundSyntheses(session.id),
            hcc_bridge: buildProjectAssetsHccBridgePayload(synthesis)
        });
    } catch (error) {
        const status = /not found/i.test(error.message) ? 404 : (error.status || 400);
        res.status(status).json({
            error: error.message,
            details: error.payload || null
        });
    }
});

app.get('/api/group-chat/memory-index/requeue-candidates', async (req, res) => {
    try {
        const result = await vcpCoreClient.listIndexRequeueCandidates(
            buildMemoryIndexRepairOptions(req.query || {}, {
                limit: 5,
                maxScan: 120,
                maxLimit: 20
            })
        );
        res.json({
            ...result,
            dry_run: true
        });
    } catch (error) {
        res.status(error.status || 500).json({
            error: error.message,
            details: error.payload || null
        });
    }
});

app.post('/api/group-chat/memory-index/requeue-batch', async (req, res) => {
    try {
        const result = await vcpCoreClient.requeueIndexBatch(
            buildMemoryIndexRepairBatchPayload(req.body || {})
        );
        res.json(result);
    } catch (error) {
        res.status(error.status || 500).json({
            error: error.message,
            details: error.payload || null
        });
    }
});

app.post('/api/group-chat/sessions/:id/reflection', async (req, res) => {
    try {
        const session = sessionService.getSession(req.params.id);
        if (!session) {
            return res.status(404).json({ error: 'session not found' });
        }

        const [roles, persons] = await Promise.all([
            vcpCoreClient.listRoles().catch(() => []),
            Promise.resolve(personIdentityService.listPersons())
        ]);
        const draft = buildSessionReflectionDraftWithRoles(session, { roles, persons });
        const result = sessionService.createSessionReflection(req.params.id, draft);
        res.status(201).json({
            ...result,
            ...await getSessionMemoryPayload(req.params.id)
        });
    } catch (error) {
        res.status(error.status || 500).json({
            error: error.message,
            details: error.payload || null
        });
    }
});

app.post('/api/group-chat/sessions/:id/memory-candidates/:candidateId/confirm', async (req, res) => {
    try {
        const session = sessionService.getSession(req.params.id);
        if (!session) {
            return res.status(404).json({ error: 'session not found' });
        }

        const confirmedBy = normalizeText(req.body?.confirmed_by) || USER_NAME;
        const existingCandidate = sessionService.getMemoryCandidate(req.params.id, req.params.candidateId);
        if (!existingCandidate) {
            return res.status(404).json({ error: 'memory candidate not found' });
        }
        if (
            existingCandidate.status === 'confirmed'
            && existingCandidate.core_write_status === 'written'
        ) {
            return res.json(await getMemoryCandidateResponsePayload(req.params.id, existingCandidate));
        }

        let candidate = sessionService.updateMemoryCandidateStatus(
            req.params.id,
            req.params.candidateId,
            'confirmed',
            {
                confirmed_by: confirmedBy,
                core_write_status: 'confirmed_pending_core_adapter',
                core_write_result: {
                    message: '产品层已确认该候选记忆；长期写入由 VCP 核心记忆适配器接管。'
                }
            }
        );

        try {
            const coreWriteResult = await vcpCoreClient.writeMemoryCandidate(
                buildCoreMemoryCandidatePayload({ session, candidate, confirmedBy })
            );
            candidate = sessionService.updateMemoryCandidateStatus(
                session.id,
                candidate.id,
                'confirmed',
                {
                    confirmed_by: confirmedBy,
                    core_write_status: coreWriteResult?.core_write_status || 'written',
                    core_write_result: coreWriteResult
                }
            );
        } catch (writeError) {
            candidate = sessionService.updateMemoryCandidateStatus(
                session.id,
                candidate.id,
                'confirmed',
                {
                    confirmed_by: confirmedBy,
                    core_write_status: 'write_failed',
                    core_write_result: {
                        message: writeError.message,
                        status: writeError.status || 500,
                        details: writeError.payload || null
                    }
                }
            );
        }

        res.json(await getMemoryCandidateResponsePayload(req.params.id, candidate));
    } catch (error) {
        const status = /not found/i.test(error.message) ? 404 : (error.status || 500);
        res.status(status).json({
            error: error.message,
            details: error.payload || null
        });
    }
});

app.post('/api/group-chat/sessions/:id/memory-candidates/:candidateId/dismiss', async (req, res) => {
    try {
        const session = sessionService.getSession(req.params.id);
        if (!session) {
            return res.status(404).json({ error: 'session not found' });
        }

        const candidate = sessionService.updateMemoryCandidateStatus(
            req.params.id,
            req.params.candidateId,
            'dismissed',
            {
                core_write_status: 'dismissed',
                core_write_result: {
                    message: '用户已忽略该候选记忆。'
                }
            }
        );

        res.json(await getMemoryCandidateResponsePayload(req.params.id, candidate));
    } catch (error) {
        const status = /not found/i.test(error.message) ? 404 : (error.status || 500);
        res.status(status).json({
            error: error.message,
            details: error.payload || null
        });
    }
});

app.post('/api/group-chat/sessions/:id/messages', async (req, res) => {
    try {
        const existingSession = sessionService.getSession(req.params.id);
        if (!existingSession) {
            return res.status(404).json({ error: 'session not found' });
        }

        const content = req.body?.content && typeof req.body.content === 'object'
            ? req.body.content
            : { text: String(req.body?.content?.text || req.body?.text || '') };

        const userMessage = sessionService.addMessage(req.params.id, {
            role: 'user',
            speaker_id: 'user',
            speaker_name: USER_NAME,
            content,
            round_index: (existingSession.messages.at(-1)?.round_index || 0) + 1
        });
        sessionEventHub.publish('message_added', {
            session_id: req.params.id,
            profile_id: existingSession.profile_id,
            message: userMessage
        });

        const result = await orchestrator.runRound({
            sessionId: req.params.id,
            userMessage,
            includeRoleIds: req.body?.include_role_ids || [],
            excludeRoleIds: req.body?.exclude_role_ids || [],
            phase: req.body?.phase || 'discuss',
            roundIndex: userMessage.round_index
        });
        for (const message of result.assistant_messages || []) {
            sessionEventHub.publish('message_added', {
                session_id: req.params.id,
                profile_id: existingSession.profile_id,
                message
            });
        }
        sessionEventHub.publish('round_completed', {
            session_id: req.params.id,
            profile_id: existingSession.profile_id,
            user_message: userMessage,
            assistant_messages: result.assistant_messages,
            target_roles: result.target_roles,
            failed_roles: result.failed_roles || [],
            selection_trace: result.selection_trace || null,
            session: sessionService.getSession(req.params.id)
        });

        res.json({
            user_message: userMessage,
            assistant_messages: result.assistant_messages,
            target_roles: result.target_roles,
            failed_roles: result.failed_roles || [],
            selection_trace: result.selection_trace || null,
            session: sessionService.getSession(req.params.id)
        });
    } catch (error) {
        res.status(error.status || 500).json({
            error: error.message,
            details: error.payload || null
        });
    }
});

function writeSseEvent(res, eventName, payload = {}) {
    if (res.writableEnded || res.destroyed) {
        return;
    }
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

app.post('/api/group-chat/sessions/:id/messages/stream', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const keepAlive = setInterval(() => {
        if (!res.writableEnded && !res.destroyed) {
            res.write(': keepalive\n\n');
        }
    }, 15000);

    let existingSession = null;
    const emit = async (eventName, payload = {}) => {
        writeSseEvent(res, eventName, payload);
        if (eventName === 'role_completed' && payload?.message) {
            sessionEventHub.publish('message_added', {
                session_id: req.params.id,
                profile_id: existingSession?.profile_id || null,
                message: payload.message
            });
        }
    };

    try {
        existingSession = sessionService.getSession(req.params.id);
        if (!existingSession) {
            writeSseEvent(res, 'error', { error: 'session not found' });
            return;
        }

        const content = req.body?.content && typeof req.body.content === 'object'
            ? req.body.content
            : { text: String(req.body?.content?.text || req.body?.text || '') };

        const userMessage = sessionService.addMessage(req.params.id, {
            role: 'user',
            speaker_id: 'user',
            speaker_name: USER_NAME,
            content,
            round_index: (existingSession.messages.at(-1)?.round_index || 0) + 1
        });
        sessionEventHub.publish('message_added', {
            session_id: req.params.id,
            profile_id: existingSession.profile_id,
            message: userMessage
        });

        writeSseEvent(res, 'user_message', {
            user_message: userMessage,
            session_id: req.params.id,
            round_index: userMessage.round_index
        });

        const result = await orchestrator.runRoundStream({
            sessionId: req.params.id,
            userMessage,
            includeRoleIds: req.body?.include_role_ids || [],
            excludeRoleIds: req.body?.exclude_role_ids || [],
            phase: req.body?.phase || 'discuss',
            roundIndex: userMessage.round_index,
            emit
        });

        writeSseEvent(res, 'round_completed', {
            user_message: userMessage,
            assistant_messages: result.assistant_messages,
            target_roles: result.target_roles,
            failed_roles: result.failed_roles || [],
            selection_trace: result.selection_trace || null,
            session: sessionService.getSession(req.params.id)
        });
        sessionEventHub.publish('round_completed', {
            session_id: req.params.id,
            profile_id: existingSession.profile_id,
            user_message: userMessage,
            assistant_messages: result.assistant_messages,
            target_roles: result.target_roles,
            failed_roles: result.failed_roles || [],
            selection_trace: result.selection_trace || null,
            session: sessionService.getSession(req.params.id)
        });
    } catch (error) {
        writeSseEvent(res, 'error', {
            error: error.message,
            details: error.payload || null
        });
    } finally {
        clearInterval(keepAlive);
        if (!res.writableEnded && !res.destroyed) {
            res.end();
        }
    }
});

app.post('/api/group-chat/sessions/:id/ephemeral-roles', (req, res) => {
    try {
        const session = sessionService.getSession(req.params.id);
        if (!session) {
            return res.status(404).json({ error: 'session not found' });
        }

        const roleSpec = req.body || {};
        if (!roleSpec.name) {
            return res.status(400).json({ error: 'name is required' });
        }

        const role = sessionService.createEphemeralRole(req.params.id, roleSpec);
        res.status(201).json({ role });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.patch('/api/group-chat/sessions/:id/ephemeral-roles/:roleId/model', (req, res) => {
    try {
        const role = sessionService.updateEphemeralRoleModel(
            req.params.id,
            req.params.roleId,
            req.body?.model || ''
        );
        res.json({ role });
    } catch (error) {
        const status = /not found/i.test(error.message) ? 404 : 400;
        res.status(status).json({ error: error.message });
    }
});

app.delete('/api/group-chat/sessions/:id/ephemeral-roles/:roleId', (req, res) => {
    try {
        const role = sessionService.deleteEphemeralRole(
            req.params.id,
            req.params.roleId
        );
        res.json({ role });
    } catch (error) {
        const status = /not found/i.test(error.message) ? 404 : 400;
        res.status(status).json({ error: error.message });
    }
});

app.post('/api/group-chat/sessions/:id/ephemeral-roles/:roleId/promote', async (req, res) => {
    try {
        const ephemeralRole = sessionService.getEphemeralRole(req.params.id, req.params.roleId);
        if (!ephemeralRole) {
            return res.status(404).json({ error: 'ephemeral role not found' });
        }

        const roleSpec = ephemeralRole.role_spec || {};
        const importedRole = await vcpCoreClient.importRole({
            id: req.body?.id || undefined,
            name: roleSpec.name || ephemeralRole.name,
            source: req.body?.source || 'groupchat_promotion',
            description: roleSpec.description || ephemeralRole.description,
            avatar: roleSpec.avatar || ephemeralRole.avatar,
            tag: roleSpec.tag || '',
            model: roleSpec.model || '',
            temperature: roleSpec.temperature,
            max_tokens: roleSpec.max_tokens,
            output_tokens: roleSpec.output_tokens,
            context_token_limit: roleSpec.context_token_limit,
            persona: roleSpec.persona || '',
            responsibilities: roleSpec.responsibilities || [],
            collaboration_guide: roleSpec.collaboration_guide || '',
            voice_style: roleSpec.voice_style || '',
            memory: roleSpec.memory || null,
            invite_prompt: roleSpec.invite_prompt || '',
            template_content: roleSpec.template_content || ''
        });

        sessionService.markEphemeralRolePromoted(req.params.roleId, importedRole.id);
        res.json({ role: importedRole });
    } catch (error) {
        res.status(error.status || 500).json({
            error: error.message,
            details: error.payload || null
        });
    }
});

app.patch('/api/core-roles/:roleId/model', async (req, res) => {
    try {
        const existingRole = await vcpCoreClient.getRole(req.params.roleId);
        if (!existingRole) {
            return res.status(404).json({ error: 'role not found' });
        }
        if (existingRole.is_native) {
            return res.status(400).json({ error: 'native role model update is not supported' });
        }

        const updatedRole = await vcpCoreClient.importRole({
            ...existingRole,
            model: String(req.body?.model || '').trim(),
            template_content: existingRole.template_content || ''
        });

        res.json({ role: updatedRole });
    } catch (error) {
        res.status(error.status || 500).json({
            error: error.message,
            details: error.payload || null
        });
    }
});

app.listen(PORT, () => {
    console.log(`GroupChatBackend listening on port ${PORT}`);
});
