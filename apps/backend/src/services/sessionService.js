const crypto = require('crypto');
const { nowIso, DEFAULT_PROFILE, DEFAULT_TEAM } = require('../db/database');

function randomId(prefix) {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`;
}

function createServiceError(status, message, payload = null) {
    const error = new Error(message);
    error.status = status;
    error.payload = payload;
    return error;
}

function safeJsonParse(value, fallback = null) {
    try {
        return JSON.parse(value);
    } catch (error) {
        return fallback;
    }
}

function summarizeTitle(text) {
    const trimmed = String(text || '').replace(/\s+/g, ' ').trim();
    if (!trimmed) {
        return '新会话';
    }
    return trimmed.slice(0, 24);
}

function slugify(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .replace(/_{2,}/g, '_');
}

function safeJsonStringify(value, fallback = '{}') {
    try {
        return JSON.stringify(value ?? {});
    } catch (error) {
        return fallback;
    }
}

function normalizeMemoryCandidateStatus(value, fallback = 'pending') {
    const normalized = String(value || '').trim().toLowerCase();
    if (['pending', 'confirmed', 'dismissed'].includes(normalized)) {
        return normalized;
    }
    return fallback;
}

function normalizeConversationPolicy(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (['project', 'decision'].includes(normalized)) {
        return normalized;
    }
    if (['casual', 'chat', 'normal', 'ordinary'].includes(normalized)) {
        return 'casual';
    }
    return 'casual';
}

function normalizeConsensusState(value, fallback = 'exploration_only') {
    const normalized = String(value || '').trim().toLowerCase();
    if ([
        'none',
        'exploration_only',
        'consensus',
        'consensus_with_caveats',
        'split_decision',
        'blocked'
    ].includes(normalized)) {
        return normalized;
    }
    return fallback;
}

function normalizeRoundIndex(value) {
    const roundIndex = Number(value);
    if (!Number.isInteger(roundIndex) || roundIndex < 0) {
        throw new Error('round_index must be a non-negative integer');
    }
    return roundIndex;
}

function normalizeJsonArray(value) {
    return Array.isArray(value)
        ? value.filter(item => item != null)
        : [];
}

function normalizeJsonObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : {};
}

function isEmptyProjectAssetValue(value) {
    if (value === null || value === undefined) {
        return true;
    }
    if (Array.isArray(value)) {
        return value.length === 0;
    }
    if (typeof value === 'object') {
        return Object.values(value).every(isEmptyProjectAssetValue);
    }
    if (typeof value === 'string') {
        return !value.trim();
    }
    return false;
}

function findNonEmptyProjectAssetFields(projectAssets = {}) {
    return Object.entries(projectAssets)
        .filter(([, value]) => !isEmptyProjectAssetValue(value))
        .map(([field]) => field);
}

function assertRoundSynthesisPolicyBoundary(conversationPolicy, projectAssets) {
    if (conversationPolicy !== 'casual') {
        return;
    }

    const fields = findNonEmptyProjectAssetFields(projectAssets);
    if (fields.length > 0) {
        throw createServiceError(
            400,
            `casual round synthesis cannot include project_assets: ${fields.join(', ')}`,
            {
                conversation_policy: conversationPolicy,
                fields
            }
        );
    }
}

function collectProjectAssetRecommendedTasks(projectAssets = {}) {
    return [
        ...normalizeJsonArray(projectAssets.recommended_tasks),
        ...normalizeJsonArray(projectAssets.tasks)
    ];
}

function isRuntimeOnlyMemoryCandidateContent(value) {
    const text = String(value || '').replace(/\s+/g, '');
    if (!text) {
        return false;
    }

    const mentionsUnavailableMemory = /(?:当前|本轮)?(?:公共|共享|团队共享)?记忆(?:无可用内容|当前无可用|无可用|暂无可用|暂不可用|为空)/.test(text)
        || /当前无可用共享记忆/.test(text);
    const mentionsPrivateUnreadable = /私有记忆(?:暂不可读|不可读|暂不可用|未注入|无法读取)/.test(text);
    const describesMemoryBoundary = /(?:区分|辨认).*(?:私有|公共|共享).*记忆(?:边界)?/.test(text)
        || /记忆边界/.test(text);

    return mentionsPrivateUnreadable && (mentionsUnavailableMemory || describesMemoryBoundary);
}

function normalizeMemoryCandidateInput(candidate) {
    const content = String(candidate?.content || '').trim();
    if (!content || isRuntimeOnlyMemoryCandidateContent(content)) {
        return null;
    }

    return {
        scope: String(candidate.scope || 'shared').trim() || 'shared',
        target_role_id: candidate.target_role_id || candidate.targetRoleId || null,
        target_role_name: candidate.target_role_name || candidate.targetRoleName || null,
        target_person_id: candidate.target_person_id || candidate.targetPersonId || null,
        target_membership_id: candidate.target_membership_id || candidate.targetMembershipId || null,
        memory_owner_type: String(candidate.memory_owner_type || candidate.memoryOwnerType || '').trim() || 'legacy_role',
        memory_owner_id: candidate.memory_owner_id || candidate.memoryOwnerId || null,
        notebook: String(candidate.notebook || '公共').trim() || '公共',
        content,
        reason: String(candidate.reason || '').trim()
    };
}

function normalizeProfileMode(mode) {
    const normalized = String(mode || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    const compact = normalized.replace(/_/g, '');
    if (compact === 'sequential') {
        return 'sequential';
    }
    if (compact === 'inviteonly') {
        return 'invite_only';
    }
    if (compact === 'naturerandom' || compact === 'naturalrandom') {
        return 'naturerandom';
    }
    return 'sequential';
}

function normalizeModeOptions(mode, rawOptions = null) {
    const normalizedMode = normalizeProfileMode(mode);
    const defaultsByMode = {
        sequential: {},
        invite_only: {},
        naturerandom: {
            mention_mode: 'priority',
            random_min_speakers: 2,
            random_max_speakers: 3
        }
    };
    const defaults = defaultsByMode[normalizedMode] || {};
    const source = rawOptions && typeof rawOptions === 'object'
        ? rawOptions
        : {};
    const preservedOptions = Object.fromEntries(Object.entries(source));

    if (normalizedMode !== 'naturerandom') {
        return preservedOptions;
    }

    const mentionMode = ['priority', 'additive', 'ignore'].includes(String(source.mention_mode || '').trim())
        ? String(source.mention_mode).trim()
        : defaults.mention_mode;

    const minSpeakersRaw = Number(source.random_min_speakers);
    const maxSpeakersRaw = Number(source.random_max_speakers);
    const minSpeakers = Number.isFinite(minSpeakersRaw)
        ? Math.max(1, Math.min(6, Math.floor(minSpeakersRaw)))
        : defaults.random_min_speakers;
    const maxSpeakers = Number.isFinite(maxSpeakersRaw)
        ? Math.max(1, Math.min(8, Math.floor(maxSpeakersRaw)))
        : defaults.random_max_speakers;

    return {
        ...preservedOptions,
        mention_mode: mentionMode,
        random_min_speakers: Math.min(minSpeakers, maxSpeakers),
        random_max_speakers: Math.max(minSpeakers, maxSpeakers)
    };
}

class SessionService {
    constructor(db) {
        this.db = db;
    }

    listTeams() {
        const teams = this.db.prepare(`
            SELECT id, name, description, created_at
            FROM teams
            ORDER BY created_at ASC
        `).all();

        const statsStmt = this.db.prepare(`
            SELECT
                COUNT(*) AS profile_count,
                MAX(created_at) AS latest_profile_created_at
            FROM group_profiles
            WHERE team_id = ?
        `);

        const memberStatsStmt = this.db.prepare(`
            SELECT
                COUNT(*) AS member_count
            FROM team_members
            WHERE team_id = ?
              AND enabled = 1
        `);

        return teams.map(team => {
            const stats = statsStmt.get(team.id) || {};
            const memberStats = memberStatsStmt.get(team.id) || {};
            return {
                ...team,
                profile_count: Number(stats.profile_count || 0),
                latest_profile_created_at: stats.latest_profile_created_at || null,
                member_count: Number(memberStats.member_count || 0)
            };
        });
    }

    getTeam(teamId) {
        return this.listTeams().find(team => team.id === teamId) || null;
    }

    getTeamByName(teamName) {
        const normalizedName = String(teamName || '').trim();
        if (!normalizedName) {
            return null;
        }
        return this.listTeams().find(team => String(team.name || '').trim() === normalizedName) || null;
    }

    listTeamMembers(teamId) {
        const normalizedTeamId = String(teamId || '').trim();
        if (!normalizedTeamId) {
            return [];
        }

        return this.db.prepare(`
            SELECT team_id, role_id, role_name, role_order, enabled
            FROM team_members
            WHERE team_id = ?
              AND enabled = 1
            ORDER BY role_order ASC, role_name ASC
        `).all(normalizedTeamId).map(row => ({
            team_id: row.team_id,
            role_id: row.role_id,
            role_name: row.role_name,
            role_order: Number(row.role_order || 0),
            enabled: Boolean(row.enabled)
        }));
    }

    listTeamMembersByTeamId(teamIds = null) {
        const ids = Array.isArray(teamIds) && teamIds.length
            ? teamIds
            : this.listTeams().map(team => team.id);

        return ids.reduce((acc, teamId) => {
            acc[teamId] = this.listTeamMembers(teamId);
            return acc;
        }, {});
    }

    isRoleInTeam(teamId, roleId) {
        const normalizedTeamId = String(teamId || '').trim();
        const normalizedRoleId = String(roleId || '').trim();
        if (!normalizedTeamId || !normalizedRoleId) {
            return false;
        }
        const row = this.db.prepare(`
            SELECT 1
            FROM team_members
            WHERE team_id = ?
              AND role_id = ?
              AND enabled = 1
            LIMIT 1
        `).get(normalizedTeamId, normalizedRoleId);
        return Boolean(row);
    }

    addTeamMember(teamId, roleId, roleName = '', roleOrder = null) {
        const team = this.getTeam(teamId);
        if (!team) {
            throw new Error(`team not found: ${teamId}`);
        }

        const normalizedRoleId = String(roleId || '').trim();
        if (!normalizedRoleId) {
            throw new Error('role_id is required');
        }

        const existingMembers = this.listTeamMembers(team.id);
        const nextOrder = roleOrder != null
            ? Number(roleOrder)
            : Math.max(0, ...existingMembers.map(member => member.role_order || 0)) + 10;
        const nextRoleName = String(roleName || '').trim() || normalizedRoleId;

        this.db.prepare(`
            INSERT INTO team_members (team_id, role_id, role_name, role_order, enabled)
            VALUES (?, ?, ?, ?, 1)
            ON CONFLICT(team_id, role_id)
            DO UPDATE SET
                role_name = excluded.role_name,
                role_order = excluded.role_order,
                enabled = 1
        `).run(team.id, normalizedRoleId, nextRoleName, nextOrder);

        return this.listTeamMembers(team.id);
    }

    removeTeamMember(teamId, roleId) {
        const team = this.getTeam(teamId);
        if (!team) {
            throw new Error(`team not found: ${teamId}`);
        }

        const normalizedRoleId = String(roleId || '').trim();
        if (!normalizedRoleId) {
            throw new Error('role_id is required');
        }

        const tx = this.db.transaction(() => {
            this.db.prepare(`
                UPDATE team_members
                SET enabled = 0
                WHERE team_id = ? AND role_id = ?
            `).run(team.id, normalizedRoleId);

            // Team member removal should cascade to all group-profile memberships under this team.
            this.db.prepare(`
                UPDATE group_profile_members
                SET enabled = 0
                WHERE role_id = ?
                  AND profile_id IN (
                      SELECT id
                      FROM group_profiles
                      WHERE team_id = ?
                  )
            `).run(normalizedRoleId, team.id);
        });
        tx();

        return this.listTeamMembers(team.id);
    }

    generateTeamId(seed) {
        const base = `team_${slugify(seed) || crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
        let teamId = base;
        let counter = 2;

        while (this.db.prepare('SELECT 1 FROM teams WHERE id = ?').get(teamId)) {
            teamId = `${base}_${counter}`;
            counter += 1;
        }

        return teamId;
    }

    createTeam(payload = {}) {
        const name = String(payload.name || '').trim();
        if (!name) {
            throw new Error('team name is required');
        }
        if (this.getTeamByName(name)) {
            throw new Error(`team name already exists: ${name}`);
        }

        const id = this.generateTeamId(payload.id || name);
        const createdAt = nowIso();
        const description = String(payload.description || '').trim();

        this.db.prepare(`
            INSERT INTO teams (id, name, description, created_at)
            VALUES (?, ?, ?, ?)
        `).run(id, name, description, createdAt);

        return this.getTeam(id);
    }

    updateTeam(teamId, payload = {}) {
        const team = this.getTeam(teamId);
        if (!team) {
            throw new Error(`team not found: ${teamId}`);
        }

        const hasName = Object.prototype.hasOwnProperty.call(payload, 'name');
        const hasDescription = Object.prototype.hasOwnProperty.call(payload, 'description');
        const nextName = hasName ? String(payload.name || '').trim() : team.name;
        const nextDescription = hasDescription ? String(payload.description || '').trim() : team.description;

        if (!nextName) {
            throw new Error('team name is required');
        }
        const duplicateByName = this.getTeamByName(nextName);
        if (duplicateByName && duplicateByName.id !== teamId) {
            throw new Error(`team name already exists: ${nextName}`);
        }

        this.db.prepare(`
            UPDATE teams
            SET name = ?, description = ?
            WHERE id = ?
        `).run(nextName, nextDescription, teamId);

        return this.getTeam(teamId);
    }

    deleteTeam(teamId) {
        const team = this.getTeam(teamId);
        if (!team) {
            throw new Error(`team not found: ${teamId}`);
        }
        if (team.id === DEFAULT_TEAM.id) {
            throw new Error('default team cannot be deleted');
        }

        const profileCount = this.db.prepare(`
            SELECT COUNT(*) AS count
            FROM group_profiles
            WHERE team_id = ?
        `).get(teamId);

        if (Number(profileCount?.count || 0) > 0) {
            throw new Error('team still has group profiles');
        }

        this.db.prepare(`
            DELETE FROM team_members
            WHERE team_id = ?
        `).run(teamId);

        this.db.prepare(`
            DELETE FROM teams
            WHERE id = ?
        `).run(teamId);

        return team;
    }

    listProfiles(options = {}) {
        const teamId = String(options.teamId || '').trim();
        const query = teamId
            ? `
                SELECT id, team_id, name, description, mode, invite_prompt, mode_options_json, group_prompt, created_at
                FROM group_profiles
                WHERE team_id = ?
                ORDER BY created_at ASC
            `
            : `
                SELECT id, team_id, name, description, mode, invite_prompt, mode_options_json, group_prompt, created_at
                FROM group_profiles
                ORDER BY created_at ASC
            `;

        const profiles = teamId
            ? this.db.prepare(query).all(teamId)
            : this.db.prepare(query).all();

        const memberStmt = this.db.prepare(`
            SELECT profile_id, role_id, role_name, role_order, enabled
            FROM group_profile_members
            WHERE profile_id = ?
            ORDER BY role_order ASC, role_name ASC
        `);

        const sessionStatsStmt = this.db.prepare(`
            SELECT
                COUNT(*) AS session_count,
                MAX(updated_at) AS latest_session_updated_at
            FROM sessions
            WHERE profile_id = ?
        `);

        return profiles.map(profile => {
            const { mode_options_json: _modeOptionsJson, ...restProfile } = profile;
            const sessionStats = sessionStatsStmt.get(profile.id) || {};
            const normalizedMode = normalizeProfileMode(profile.mode);
            const parsedModeOptions = safeJsonParse(profile.mode_options_json, {});
            const modeOptions = normalizeModeOptions(normalizedMode, parsedModeOptions);
            return {
                ...restProfile,
                mode: normalizedMode,
                invite_prompt: String(profile.invite_prompt || ''),
                mode_options: modeOptions,
                session_count: Number(sessionStats.session_count || 0),
                latest_session_updated_at: sessionStats.latest_session_updated_at || null,
                members: memberStmt.all(profile.id).map(row => ({
                    role_id: row.role_id,
                    role_name: row.role_name,
                    role_order: row.role_order,
                    enabled: Boolean(row.enabled)
                }))
            };
        });
    }

    getProfile(profileId) {
        return this.listProfiles().find(profile => profile.id === profileId) || null;
    }

    createProfile(payload = {}) {
        const name = String(payload.name || '').trim();
        if (!name) {
            throw new Error('profile name is required');
        }

        const cloneFromProfileId = payload.clone_from_profile_id || payload.cloneFromProfileId || null;
        const sourceProfile = cloneFromProfileId ? this.getProfile(cloneFromProfileId) : null;
        if (cloneFromProfileId && !sourceProfile) {
            throw new Error(`group profile not found: ${cloneFromProfileId}`);
        }

        const profileId = this.generateProfileId(payload.id || name);
        const createdAt = nowIso();
        const teamIdCandidate = String(payload.team_id || payload.teamId || '').trim();
        const teamId = teamIdCandidate || sourceProfile?.team_id || DEFAULT_TEAM.id;
        if (!this.getTeam(teamId)) {
            throw new Error(`team not found: ${teamId}`);
        }
        const description = String(payload.description || '').trim()
            || sourceProfile?.description
            || '';
        const mode = normalizeProfileMode(
            payload.mode || sourceProfile?.mode || 'sequential'
        );
        const invitePrompt = String(payload.invite_prompt ?? payload.invitePrompt ?? '').trim()
            || String(sourceProfile?.invite_prompt || '').trim()
            || '';
        const hasPayloadModeOptions =
            Object.prototype.hasOwnProperty.call(payload, 'mode_options')
            || Object.prototype.hasOwnProperty.call(payload, 'modeOptions');
        const sourceModeOptions = normalizeJsonObject(sourceProfile?.mode_options);
        const submittedModeOptions = normalizeJsonObject(payload.mode_options ?? payload.modeOptions);
        const modeOptions = normalizeModeOptions(
            mode,
            hasPayloadModeOptions
                ? { ...sourceModeOptions, ...submittedModeOptions }
                : sourceModeOptions
        );
        const groupPrompt = String(payload.group_prompt || payload.groupPrompt || '').trim()
            || sourceProfile?.group_prompt
            || '';

        this.db.prepare(`
            INSERT INTO group_profiles (id, team_id, name, description, mode, invite_prompt, mode_options_json, group_prompt, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(profileId, teamId, name, description, mode, invitePrompt, JSON.stringify(modeOptions), groupPrompt, createdAt);

        const sourceMembers = (sourceProfile?.members || [])
            .filter(member => member.enabled)
            .map(member => ({
                role_id: member.role_id,
                role_name: member.role_name,
                role_order: member.role_order
            }));
        const baseOrder = Math.max(0, ...sourceMembers.map(member => Number(member.role_order || 0)));

        const additionalMembers = Array.isArray(payload.members)
            ? payload.members
                .filter(member => member && member.role_id)
                .map((member, index) => ({
                    role_id: member.role_id,
                    role_name: member.role_name || member.role_id,
                    role_order: member.role_order != null
                        ? Number(member.role_order)
                        : baseOrder + ((index + 1) * 10)
                }))
            : [];

        const mergedMembers = new Map();
        for (const member of [...sourceMembers, ...additionalMembers]) {
            mergedMembers.set(member.role_id, member);
        }

        const insertMember = this.db.prepare(`
            INSERT INTO group_profile_members (profile_id, role_id, role_name, role_order, enabled)
            VALUES (?, ?, ?, ?, 1)
        `);

        for (const member of mergedMembers.values()) {
            insertMember.run(
                profileId,
                member.role_id,
                member.role_name || member.role_id,
                Number(member.role_order || 0)
            );
        }

        return this.getProfile(profileId);
    }

    updateProfile(profileId, payload = {}) {
        const profile = this.getProfile(profileId);
        if (!profile) {
            throw new Error(`group profile not found: ${profileId}`);
        }

        const hasName = Object.prototype.hasOwnProperty.call(payload, 'name');
        const hasDescription = Object.prototype.hasOwnProperty.call(payload, 'description');
        const hasMode =
            Object.prototype.hasOwnProperty.call(payload, 'mode');
        const hasInvitePrompt =
            Object.prototype.hasOwnProperty.call(payload, 'invite_prompt')
            || Object.prototype.hasOwnProperty.call(payload, 'invitePrompt');
        const hasModeOptions =
            Object.prototype.hasOwnProperty.call(payload, 'mode_options')
            || Object.prototype.hasOwnProperty.call(payload, 'modeOptions');
        const hasGroupPrompt =
            Object.prototype.hasOwnProperty.call(payload, 'group_prompt')
            || Object.prototype.hasOwnProperty.call(payload, 'groupPrompt');
        const hasTeamId =
            Object.prototype.hasOwnProperty.call(payload, 'team_id')
            || Object.prototype.hasOwnProperty.call(payload, 'teamId');

        const nextName = hasName ? String(payload.name || '').trim() : profile.name;
        const nextDescription = hasDescription ? String(payload.description || '').trim() : profile.description;
        const nextMode = hasMode
            ? normalizeProfileMode(payload.mode)
            : normalizeProfileMode(profile.mode || 'sequential');
        const nextInvitePrompt = hasInvitePrompt
            ? String(payload.invite_prompt ?? payload.invitePrompt ?? '').trim()
            : String(profile.invite_prompt || '').trim();
        const submittedModeOptions = normalizeJsonObject(payload.mode_options ?? payload.modeOptions);
        const nextModeOptions = normalizeModeOptions(
            nextMode,
            hasModeOptions
                ? { ...normalizeJsonObject(profile.mode_options), ...submittedModeOptions }
                : (profile.mode_options || {})
        );
        const nextGroupPrompt = hasGroupPrompt
            ? String(payload.group_prompt ?? payload.groupPrompt ?? '').trim()
            : profile.group_prompt;
        const nextTeamId = hasTeamId
            ? String(payload.team_id ?? payload.teamId ?? '').trim()
            : profile.team_id;

        if (!nextName) {
            throw new Error('profile name is required');
        }
        if (!nextGroupPrompt) {
            throw new Error('group_prompt is required');
        }
        if (!nextTeamId) {
            throw new Error('team_id is required');
        }
        if (!this.getTeam(nextTeamId)) {
            throw new Error(`team not found: ${nextTeamId}`);
        }

        this.db.prepare(`
            UPDATE group_profiles
            SET team_id = ?, name = ?, description = ?, mode = ?, invite_prompt = ?, mode_options_json = ?, group_prompt = ?
            WHERE id = ?
        `).run(
            nextTeamId,
            nextName,
            nextDescription,
            nextMode,
            nextInvitePrompt,
            JSON.stringify(nextModeOptions),
            nextGroupPrompt,
            profileId
        );

        return this.getProfile(profileId);
    }

    deleteProfile(profileId) {
        const profile = this.getProfile(profileId);
        if (!profile) {
            throw new Error(`group profile not found: ${profileId}`);
        }

        if (profile.id === DEFAULT_PROFILE.id) {
            throw new Error('default profile cannot be deleted');
        }

        if (Number(profile.session_count || 0) > 0) {
            throw new Error('group profile has session history and cannot be deleted');
        }

        this.db.prepare(`
            DELETE FROM group_profile_members
            WHERE profile_id = ?
        `).run(profileId);

        this.db.prepare(`
            DELETE FROM group_profiles
            WHERE id = ?
        `).run(profileId);

        return profile;
    }

    generateProfileId(seed) {
        const base = `group_${slugify(seed) || crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
        let profileId = base;
        let counter = 2;

        while (this.db.prepare('SELECT 1 FROM group_profiles WHERE id = ?').get(profileId)) {
            profileId = `${base}_${counter}`;
            counter += 1;
        }

        return profileId;
    }

    addProfileMember(profileId, roleId, roleName = '', roleOrder = null) {
        const profile = this.getProfile(profileId);
        if (!profile) {
            throw new Error(`group profile not found: ${profileId}`);
        }

        if (!this.isRoleInTeam(profile.team_id, roleId)) {
            this.addTeamMember(profile.team_id, roleId, roleName);
        }

        const nextOrder = roleOrder != null
            ? Number(roleOrder)
            : Math.max(0, ...profile.members.map(member => member.role_order || 0)) + 10;

        this.db.prepare(`
            INSERT INTO group_profile_members (profile_id, role_id, role_name, role_order, enabled)
            VALUES (?, ?, ?, ?, 1)
            ON CONFLICT(profile_id, role_id)
            DO UPDATE SET
                role_name = excluded.role_name,
                role_order = excluded.role_order,
                enabled = 1
        `).run(profileId, roleId, roleName, nextOrder);

        return this.getProfile(profileId);
    }

    removeProfileMember(profileId, roleId) {
        const profile = this.getProfile(profileId);
        if (!profile) {
            throw new Error(`group profile not found: ${profileId}`);
        }

        this.db.prepare(`
            UPDATE group_profile_members
            SET enabled = 0
            WHERE profile_id = ? AND role_id = ?
        `).run(profileId, roleId);

        return this.getProfile(profileId);
    }

    moveProfileMember(profileId, roleId, direction) {
        const profile = this.getProfile(profileId);
        if (!profile) {
            throw new Error(`group profile not found: ${profileId}`);
        }

        if (!['up', 'down'].includes(direction)) {
            throw new Error('direction must be up or down');
        }

        const enabledMembers = (profile.members || [])
            .filter(member => member.enabled)
            .sort((a, b) => {
                const orderDiff = Number(a.role_order || 0) - Number(b.role_order || 0);
                if (orderDiff !== 0) {
                    return orderDiff;
                }
                return String(a.role_name || a.role_id).localeCompare(String(b.role_name || b.role_id), 'zh-Hans-CN');
            });

        const index = enabledMembers.findIndex(member => member.role_id === roleId);
        if (index < 0) {
            throw new Error(`profile member not found: ${roleId}`);
        }

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= enabledMembers.length) {
            return profile;
        }

        const reordered = [...enabledMembers];
        const [moved] = reordered.splice(index, 1);
        reordered.splice(targetIndex, 0, moved);

        const updateOrder = this.db.prepare(`
            UPDATE group_profile_members
            SET role_order = ?
            WHERE profile_id = ? AND role_id = ?
        `);

        const tx = this.db.transaction(items => {
            items.forEach((member, itemIndex) => {
                updateOrder.run((itemIndex + 1) * 10, profileId, member.role_id);
            });
        });

        tx(reordered);
        return this.getProfile(profileId);
    }

    listSessions() {
        return this.db.prepare(`
            SELECT id, profile_id, title, created_at, updated_at
            FROM sessions
            ORDER BY updated_at DESC
        `).all();
    }

    createSession(profileId, initialText = '') {
        const profile = this.getProfile(profileId);
        if (!profile) {
            throw new Error(`group profile not found: ${profileId}`);
        }

        const id = randomId('sess');
        const now = nowIso();
        const title = summarizeTitle(initialText || '新会话');

        this.db.prepare(`
            INSERT INTO sessions (id, profile_id, title, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        `).run(id, profile.id, title, now, now);

        return this.getSession(id);
    }

    touchSession(sessionId) {
        this.db.prepare(`
            UPDATE sessions SET updated_at = ? WHERE id = ?
        `).run(nowIso(), sessionId);
    }

    getSession(sessionId) {
        const session = this.db.prepare(`
            SELECT id, profile_id, title, created_at, updated_at
            FROM sessions
            WHERE id = ?
        `).get(sessionId);

        if (!session) {
            return null;
        }

        return {
            ...session,
            messages: this.listSessionMessages(sessionId),
            ephemeral_roles: this.listEphemeralRoles(sessionId)
        };
    }

    listSessionMessages(sessionId) {
        return this.db.prepare(`
            SELECT id, session_id, role, speaker_id, speaker_name, speaker_person_id, speaker_membership_id, content_text, content_json, round_index, created_at
            FROM session_messages
            WHERE session_id = ?
            ORDER BY created_at ASC
        `).all(sessionId).map(row => ({
            id: row.id,
            session_id: row.session_id,
            role: row.role,
            speaker_id: row.speaker_id,
            speaker_name: row.speaker_name,
            speaker_person_id: row.speaker_person_id || null,
            speaker_membership_id: row.speaker_membership_id || null,
            content: safeJsonParse(row.content_json, { text: row.content_text || '' }),
            round_index: row.round_index,
            created_at: row.created_at
        }));
    }

    addMessage(sessionId, message) {
        const id = randomId('msg');
        const createdAt = nowIso();
        const content = message.content && typeof message.content === 'object'
            ? message.content
            : { text: String(message.content || '') };
        const text = content.text || '';

        this.db.prepare(`
            INSERT INTO session_messages
            (id, session_id, role, speaker_id, speaker_name, speaker_person_id, speaker_membership_id, content_text, content_json, round_index, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            id,
            sessionId,
            message.role,
            message.speaker_id || null,
            message.speaker_name || null,
            message.speaker_person_id || message.speakerPersonId || null,
            message.speaker_membership_id || message.speakerMembershipId || null,
            text,
            JSON.stringify(content),
            message.round_index || 0,
            createdAt
        );

        this.touchSession(sessionId);

        return {
            id,
            session_id: sessionId,
            role: message.role,
            speaker_id: message.speaker_id || null,
            speaker_name: message.speaker_name || null,
            speaker_person_id: message.speaker_person_id || message.speakerPersonId || null,
            speaker_membership_id: message.speaker_membership_id || message.speakerMembershipId || null,
            content,
            round_index: message.round_index || 0,
            created_at: createdAt
        };
    }

    listSessionReflections(sessionId) {
        const normalizedSessionId = String(sessionId || '').trim();
        if (!normalizedSessionId) {
            return [];
        }

        return this.db.prepare(`
            SELECT id, session_id, summary, source_message_count, candidate_count, created_at
            FROM session_reflections
            WHERE session_id = ?
            ORDER BY created_at DESC
        `).all(normalizedSessionId).map(row => ({
            id: row.id,
            session_id: row.session_id,
            summary: row.summary,
            source_message_count: Number(row.source_message_count || 0),
            candidate_count: Number(row.candidate_count || 0),
            created_at: row.created_at
        }));
    }

    getLatestSessionReflection(sessionId) {
        return this.listSessionReflections(sessionId)[0] || null;
    }

    normalizeMemoryCandidateRow(row) {
        if (!row) {
            return null;
        }

        return {
            id: row.id,
            session_id: row.session_id,
            reflection_id: row.reflection_id || null,
            scope: row.scope || 'shared',
            target_role_id: row.target_role_id || null,
            target_role_name: row.target_role_name || null,
            target_person_id: row.target_person_id || null,
            target_membership_id: row.target_membership_id || null,
            memory_owner_type: row.memory_owner_type || 'legacy_role',
            memory_owner_id: row.memory_owner_id || null,
            notebook: row.notebook || '公共',
            content: row.content || '',
            reason: row.reason || '',
            status: normalizeMemoryCandidateStatus(row.status),
            created_at: row.created_at,
            updated_at: row.updated_at,
            confirmed_at: row.confirmed_at || null,
            confirmed_by: row.confirmed_by || null,
            core_write_status: row.core_write_status || 'not_wired',
            core_write_result: safeJsonParse(row.core_write_result_json || '{}', {})
        };
    }

    listMemoryCandidates(sessionId, options = {}) {
        const normalizedSessionId = String(sessionId || '').trim();
        if (!normalizedSessionId) {
            return [];
        }

        const status = normalizeMemoryCandidateStatus(options.status, '');
        const rows = status
            ? this.db.prepare(`
                SELECT *
                FROM memory_candidates
                WHERE session_id = ?
                  AND status = ?
                ORDER BY created_at DESC
            `).all(normalizedSessionId, status)
            : this.db.prepare(`
                SELECT *
                FROM memory_candidates
                WHERE session_id = ?
                ORDER BY created_at DESC
            `).all(normalizedSessionId);

        return rows.map(row => this.normalizeMemoryCandidateRow(row));
    }

    getMemoryCandidate(sessionId, candidateId) {
        const normalizedSessionId = String(sessionId || '').trim();
        const normalizedCandidateId = String(candidateId || '').trim();
        if (!normalizedSessionId || !normalizedCandidateId) {
            return null;
        }

        const row = this.db.prepare(`
            SELECT *
            FROM memory_candidates
            WHERE session_id = ?
              AND id = ?
        `).get(normalizedSessionId, normalizedCandidateId);

        return this.normalizeMemoryCandidateRow(row);
    }

    normalizeRoundSynthesisRow(row) {
        if (!row) {
            return null;
        }

        return {
            id: row.id,
            session_id: row.session_id,
            round_index: Number(row.round_index || 0),
            conversation_policy: normalizeConversationPolicy(row.conversation_policy),
            consensus_state: normalizeConsensusState(row.consensus_state),
            source_message_ids: safeJsonParse(row.source_message_ids_json || '[]', []),
            participant_states: safeJsonParse(row.participant_states_json || '[]', []),
            memory_deposition: safeJsonParse(row.memory_deposition_json || '{}', {}),
            project_assets: safeJsonParse(row.project_assets_json || '{}', {}),
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }

    listRoundSyntheses(sessionId) {
        const normalizedSessionId = String(sessionId || '').trim();
        if (!normalizedSessionId) {
            return [];
        }

        return this.db.prepare(`
            SELECT *
            FROM round_syntheses
            WHERE session_id = ?
            ORDER BY round_index ASC, updated_at DESC
        `).all(normalizedSessionId).map(row => this.normalizeRoundSynthesisRow(row));
    }

    getRoundSynthesis(sessionId, roundIndex) {
        const normalizedSessionId = String(sessionId || '').trim();
        if (!normalizedSessionId) {
            return null;
        }

        const row = this.db.prepare(`
            SELECT *
            FROM round_syntheses
            WHERE session_id = ?
              AND round_index = ?
        `).get(normalizedSessionId, normalizeRoundIndex(roundIndex));

        return this.normalizeRoundSynthesisRow(row);
    }

    upsertRoundSynthesis(sessionId, payload = {}) {
        const session = this.getSession(sessionId);
        if (!session) {
            throw new Error(`session not found: ${sessionId}`);
        }

        const roundIndex = normalizeRoundIndex(
            payload.round_index ?? payload.roundIndex
        );
        const conversationPolicy = normalizeConversationPolicy(
            payload.conversation_policy ?? payload.conversationPolicy
        );
        const consensusState = normalizeConsensusState(
            payload.consensus_state ?? payload.consensusState,
            conversationPolicy === 'casual' ? 'exploration_only' : 'none'
        );
        const roundMessageIds = session.messages
            .filter(message => Number(message.round_index || 0) === roundIndex)
            .map(message => message.id);
        const sourceMessageIds = normalizeJsonArray(
            payload.source_message_ids ?? payload.sourceMessageIds
        );
        const participantStates = normalizeJsonArray(
            payload.participant_states ?? payload.participantStates
        );
        const memoryDeposition = normalizeJsonObject(
            payload.memory_deposition ?? payload.memoryDeposition
        );
        const projectAssets = normalizeJsonObject(
            payload.project_assets ?? payload.projectAssets
        );
        assertRoundSynthesisPolicyBoundary(conversationPolicy, projectAssets);
        const createdAt = nowIso();
        const updatedAt = createdAt;
        const existing = this.db.prepare(`
            SELECT id, created_at
            FROM round_syntheses
            WHERE session_id = ?
              AND round_index = ?
        `).get(session.id, roundIndex);
        const synthesisId = existing?.id || randomId('synthesis');

        const write = existing
            ? this.db.prepare(`
                UPDATE round_syntheses
                SET
                    conversation_policy = ?,
                    consensus_state = ?,
                    source_message_ids_json = ?,
                    participant_states_json = ?,
                    memory_deposition_json = ?,
                    project_assets_json = ?,
                    updated_at = ?
                WHERE id = ?
            `)
            : this.db.prepare(`
                INSERT INTO round_syntheses
                (id, session_id, round_index, conversation_policy, consensus_state, source_message_ids_json, participant_states_json, memory_deposition_json, project_assets_json, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

        const tx = this.db.transaction(() => {
            if (existing) {
                write.run(
                    conversationPolicy,
                    consensusState,
                    safeJsonStringify(sourceMessageIds.length ? sourceMessageIds : roundMessageIds, '[]'),
                    safeJsonStringify(participantStates, '[]'),
                    safeJsonStringify(memoryDeposition),
                    safeJsonStringify(projectAssets),
                    updatedAt,
                    synthesisId
                );
            } else {
                write.run(
                    synthesisId,
                    session.id,
                    roundIndex,
                    conversationPolicy,
                    consensusState,
                    safeJsonStringify(sourceMessageIds.length ? sourceMessageIds : roundMessageIds, '[]'),
                    safeJsonStringify(participantStates, '[]'),
                    safeJsonStringify(memoryDeposition),
                    safeJsonStringify(projectAssets),
                    createdAt,
                    updatedAt
                );
            }
        });
        tx();
        this.touchSession(session.id);

        return this.getRoundSynthesis(session.id, roundIndex);
    }

    confirmRoundSynthesisProjectAssets(sessionId, roundIndex, options = {}) {
        const session = this.getSession(sessionId);
        if (!session) {
            throw createServiceError(404, `session not found: ${sessionId}`);
        }

        const normalizedRoundIndex = normalizeRoundIndex(roundIndex);
        const synthesis = this.getRoundSynthesis(session.id, normalizedRoundIndex);
        if (!synthesis) {
            throw createServiceError(404, `round synthesis not found: ${session.id}#${normalizedRoundIndex}`);
        }

        const conversationPolicy = normalizeConversationPolicy(synthesis.conversation_policy);
        if (!['project', 'decision'].includes(conversationPolicy)) {
            throw createServiceError(
                400,
                'only project or decision syntheses can confirm project_assets',
                {
                    conversation_policy: conversationPolicy
                }
            );
        }

        const projectAssets = normalizeJsonObject(synthesis.project_assets);
        const recommendedTasks = collectProjectAssetRecommendedTasks(projectAssets);
        if (recommendedTasks.length === 0) {
            throw createServiceError(
                400,
                'confirmed project_assets contain no recommended_tasks',
                {
                    synthesis_id: synthesis.id,
                    session_id: synthesis.session_id,
                    round_index: synthesis.round_index
                }
            );
        }

        const confirmedAt = nowIso();
        const confirmedBy = String(
            options.confirmedBy ?? options.confirmed_by ?? projectAssets.confirmed_by ?? ''
        ).trim() || 'unknown';
        const confirmedProjectAssets = {
            ...projectAssets,
            confirmed: true,
            confirmed_by: confirmedBy,
            confirmed_at: confirmedAt
        };

        this.db.prepare(`
            UPDATE round_syntheses
            SET project_assets_json = ?,
                updated_at = ?
            WHERE id = ?
        `).run(
            safeJsonStringify(confirmedProjectAssets),
            confirmedAt,
            synthesis.id
        );
        this.touchSession(session.id);

        return this.getRoundSynthesis(session.id, normalizedRoundIndex);
    }

    createSessionReflection(sessionId, payload = {}) {
        const session = this.getSession(sessionId);
        if (!session) {
            throw new Error(`session not found: ${sessionId}`);
        }

        const summary = String(payload.summary || '').trim();
        if (!summary) {
            throw new Error('summary is required');
        }

        const reflectionId = randomId('reflection');
        const createdAt = nowIso();
        const candidates = Array.isArray(payload.candidates)
            ? payload.candidates.map(normalizeMemoryCandidateInput).filter(Boolean)
            : [];
        const sourceMessageCount = Number(payload.source_message_count ?? payload.sourceMessageCount ?? session.messages.length);

        const insertReflection = this.db.prepare(`
            INSERT INTO session_reflections
            (id, session_id, summary, source_message_count, candidate_count, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        const insertCandidate = this.db.prepare(`
            INSERT INTO memory_candidates
            (id, session_id, reflection_id, scope, target_role_id, target_role_name, target_person_id, target_membership_id, memory_owner_type, memory_owner_id, notebook, content, reason, status, created_at, updated_at, core_write_status, core_write_result_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, 'not_wired', '{}')
        `);

        const tx = this.db.transaction(() => {
            insertReflection.run(
                reflectionId,
                session.id,
                summary,
                sourceMessageCount,
                candidates.length,
                createdAt
            );

            for (const candidate of candidates) {
                insertCandidate.run(
                    randomId('memcand'),
                    session.id,
                    reflectionId,
                    candidate.scope,
                    candidate.target_role_id,
                    candidate.target_role_name,
                    candidate.target_person_id,
                    candidate.target_membership_id,
                    candidate.memory_owner_type,
                    candidate.memory_owner_id,
                    candidate.notebook,
                    candidate.content,
                    candidate.reason,
                    createdAt,
                    createdAt
                );
            }
        });
        tx();
        this.touchSession(session.id);

        return {
            reflection: this.listSessionReflections(session.id).find(item => item.id === reflectionId) || null,
            candidates: this.listMemoryCandidates(session.id).filter(candidate => candidate.reflection_id === reflectionId)
        };
    }

    updateMemoryCandidateStatus(sessionId, candidateId, status, options = {}) {
        const candidate = this.getMemoryCandidate(sessionId, candidateId);
        if (!candidate) {
            throw new Error('memory candidate not found');
        }

        const normalizedStatus = normalizeMemoryCandidateStatus(status);
        const updatedAt = nowIso();
        const confirmedAt = normalizedStatus === 'confirmed'
            ? (options.confirmed_at || updatedAt)
            : candidate.confirmed_at;
        const confirmedBy = normalizedStatus === 'confirmed'
            ? String(options.confirmed_by || options.confirmedBy || candidate.confirmed_by || '').trim()
            : candidate.confirmed_by;

        this.db.prepare(`
            UPDATE memory_candidates
            SET
                status = ?,
                updated_at = ?,
                confirmed_at = ?,
                confirmed_by = ?,
                core_write_status = ?,
                core_write_result_json = ?
            WHERE session_id = ?
              AND id = ?
        `).run(
            normalizedStatus,
            updatedAt,
            confirmedAt || null,
            confirmedBy || null,
            options.core_write_status || options.coreWriteStatus || candidate.core_write_status || 'not_wired',
            safeJsonStringify(options.core_write_result || options.coreWriteResult || candidate.core_write_result || {}),
            candidate.session_id,
            candidate.id
        );

        this.touchSession(candidate.session_id);
        return this.getMemoryCandidate(candidate.session_id, candidate.id);
    }

    listEphemeralRoles(sessionId) {
        return this.db.prepare(`
            SELECT id, session_id, name, description, avatar, role_spec_json, created_at, promoted_core_role_id
            FROM ephemeral_roles
            WHERE session_id = ?
            ORDER BY created_at ASC
        `).all(sessionId).map(row => {
            const roleSpec = safeJsonParse(row.role_spec_json, {});
            return {
                id: row.id,
                session_id: row.session_id,
                name: row.name,
                description: row.description,
                avatar: row.avatar,
                role_spec: roleSpec,
                created_at: row.created_at,
                promoted_core_role_id: row.promoted_core_role_id
            };
        });
    }

    createEphemeralRole(sessionId, roleSpec) {
        const id = randomId('ephemeral_role');
        const createdAt = nowIso();
        const name = roleSpec.name || '临时角色';

        this.db.prepare(`
            INSERT INTO ephemeral_roles
            (id, session_id, name, description, avatar, role_spec_json, created_at, promoted_core_role_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
        `).run(
            id,
            sessionId,
            name,
            roleSpec.description || '',
            roleSpec.avatar || '',
            JSON.stringify(roleSpec),
            createdAt
        );

        return this.listEphemeralRoles(sessionId).find(role => role.id === id);
    }

    updateEphemeralRoleModel(sessionId, ephemeralRoleId, model) {
        const role = this.getEphemeralRole(sessionId, ephemeralRoleId);
        if (!role) {
            throw new Error('ephemeral role not found');
        }

        const roleSpec = {
            ...(role.role_spec || {}),
            model: String(model || '').trim()
        };

        this.db.prepare(`
            UPDATE ephemeral_roles
            SET role_spec_json = ?
            WHERE id = ? AND session_id = ?
        `).run(
            JSON.stringify(roleSpec),
            ephemeralRoleId,
            sessionId
        );

        this.touchSession(sessionId);
        return this.getEphemeralRole(sessionId, ephemeralRoleId);
    }

    deleteEphemeralRole(sessionId, ephemeralRoleId) {
        const role = this.getEphemeralRole(sessionId, ephemeralRoleId);
        if (!role) {
            throw new Error('ephemeral role not found');
        }

        this.db.prepare(`
            DELETE FROM ephemeral_roles
            WHERE id = ? AND session_id = ?
        `).run(ephemeralRoleId, sessionId);

        this.touchSession(sessionId);
        return role;
    }

    markEphemeralRolePromoted(ephemeralRoleId, coreRoleId) {
        this.db.prepare(`
            UPDATE ephemeral_roles
            SET promoted_core_role_id = ?
            WHERE id = ?
        `).run(coreRoleId, ephemeralRoleId);
    }

    getEphemeralRole(sessionId, ephemeralRoleId) {
        return this.listEphemeralRoles(sessionId).find(role => role.id === ephemeralRoleId) || null;
    }
}

module.exports = SessionService;
