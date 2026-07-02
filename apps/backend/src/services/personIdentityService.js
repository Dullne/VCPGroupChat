const crypto = require('crypto');
const { nowIso } = require('../db/database');

function randomId(prefix) {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`;
}

function safeJsonParse(value, fallback = {}) {
    try {
        return JSON.parse(value || '');
    } catch (error) {
        return fallback;
    }
}

function safeJsonStringify(value, fallback = '{}') {
    try {
        return JSON.stringify(value ?? {});
    } catch (error) {
        return fallback;
    }
}

function normalizeText(value) {
    return String(value ?? '').trim();
}

class PersonIdentityService {
    constructor(db) {
        this.db = db;
    }

    normalizeTemplateRow(row) {
        if (!row) {
            return null;
        }
        return {
            id: row.id,
            source: row.source,
            external_id: row.external_id || null,
            name: row.name,
            description: row.description || '',
            template_content: row.template_content || '',
            defaults: safeJsonParse(row.defaults_json, {}),
            metadata: safeJsonParse(row.metadata_json, {}),
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }

    normalizePersonRow(row) {
        if (!row) {
            return null;
        }
        return {
            id: row.id,
            display_name: row.display_name,
            source_template_id: row.source_template_id || null,
            legacy_role_id: row.legacy_role_id || null,
            identity_kind: row.identity_kind || 'person',
            description: row.description || '',
            personality: row.personality || '',
            emotional_style: row.emotional_style || '',
            voice_style: row.voice_style || '',
            relationship_profile: safeJsonParse(row.relationship_profile_json, {}),
            memory: safeJsonParse(row.memory_json, {}),
            model_preferences: safeJsonParse(row.model_preferences_json, {}),
            lifecycle_status: row.lifecycle_status || 'active',
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }

    upsertRoleTemplate(payload = {}) {
        const id = normalizeText(payload.id) || randomId('role_template');
        const source = normalizeText(payload.source) || 'manual';
        const name = normalizeText(payload.name);
        if (!name) {
            throw new Error('template name is required');
        }
        const now = nowIso();

        this.db.prepare(`
            INSERT INTO role_templates
            (id, source, external_id, name, description, template_content, defaults_json, metadata_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id)
            DO UPDATE SET
                source = excluded.source,
                external_id = excluded.external_id,
                name = excluded.name,
                description = excluded.description,
                template_content = excluded.template_content,
                defaults_json = excluded.defaults_json,
                metadata_json = excluded.metadata_json,
                updated_at = excluded.updated_at
        `).run(
            id,
            source,
            normalizeText(payload.external_id ?? payload.externalId) || null,
            name,
            normalizeText(payload.description),
            normalizeText(payload.template_content ?? payload.templateContent),
            safeJsonStringify(payload.defaults || {}),
            safeJsonStringify(payload.metadata || {}),
            now,
            now
        );

        return this.getRoleTemplate(id);
    }

    getRoleTemplate(id) {
        return this.normalizeTemplateRow(
            this.db.prepare('SELECT * FROM role_templates WHERE id = ?').get(normalizeText(id))
        );
    }

    listRoleTemplates() {
        return this.db.prepare('SELECT * FROM role_templates ORDER BY created_at ASC, name ASC')
            .all()
            .map(row => this.normalizeTemplateRow(row));
    }

    createPerson(payload = {}) {
        const displayName = normalizeText(payload.display_name ?? payload.displayName);
        if (!displayName) {
            throw new Error('display_name is required');
        }

        const now = nowIso();
        const id = normalizeText(payload.id) || randomId('person');
        this.db.prepare(`
            INSERT INTO persons
            (id, display_name, source_template_id, legacy_role_id, identity_kind, description, personality, emotional_style, voice_style, relationship_profile_json, memory_json, model_preferences_json, lifecycle_status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            id,
            displayName,
            normalizeText(payload.source_template_id ?? payload.sourceTemplateId) || null,
            normalizeText(payload.legacy_role_id ?? payload.legacyRoleId) || null,
            normalizeText(payload.identity_kind ?? payload.identityKind) || 'person',
            normalizeText(payload.description),
            normalizeText(payload.personality),
            normalizeText(payload.emotional_style ?? payload.emotionalStyle),
            normalizeText(payload.voice_style ?? payload.voiceStyle),
            safeJsonStringify(payload.relationship_profile ?? payload.relationshipProfile ?? {}),
            safeJsonStringify(payload.memory || { privateNotebook: displayName }),
            safeJsonStringify(payload.model_preferences ?? payload.modelPreferences ?? {}),
            normalizeText(payload.lifecycle_status ?? payload.lifecycleStatus) || 'active',
            now,
            now
        );

        return this.getPerson(id);
    }

    createPersonFromTemplate(templateId, payload = {}) {
        const template = this.getRoleTemplate(templateId);
        if (!template) {
            throw new Error(`role template not found: ${templateId}`);
        }

        return this.createPerson({
            ...payload,
            source_template_id: template.id,
            description: normalizeText(payload.description) || template.description,
            display_name: payload.display_name ?? payload.displayName ?? template.name
        });
    }

    getPerson(id) {
        return this.normalizePersonRow(
            this.db.prepare('SELECT * FROM persons WHERE id = ?').get(normalizeText(id))
        );
    }

    getPersonByLegacyRoleId(roleId) {
        return this.normalizePersonRow(
            this.db.prepare('SELECT * FROM persons WHERE legacy_role_id = ? ORDER BY created_at ASC LIMIT 1')
                .get(normalizeText(roleId))
        );
    }

    listPersons() {
        return this.db.prepare('SELECT * FROM persons ORDER BY created_at ASC, display_name ASC')
            .all()
            .map(row => this.normalizePersonRow(row));
    }

    updatePersonProfile(personId, patch = {}) {
        const normalizedPersonId = normalizeText(personId);
        if (!normalizedPersonId) {
            throw new Error('person_id is required');
        }

        const person = this.getPerson(normalizedPersonId);
        if (!person) {
            throw new Error(`person not found: ${personId}`);
        }

        const fieldValues = [
            ['description', normalizeText(patch.description)],
            ['personality', normalizeText(patch.personality)],
            ['emotional_style', normalizeText(patch.emotional_style ?? patch.emotionalStyle)],
            ['voice_style', normalizeText(patch.voice_style ?? patch.voiceStyle)]
        ].filter(([field, value]) => {
            const provided = Object.prototype.hasOwnProperty.call(patch, field)
                || (field === 'emotional_style' && Object.prototype.hasOwnProperty.call(patch, 'emotionalStyle'))
                || (field === 'voice_style' && Object.prototype.hasOwnProperty.call(patch, 'voiceStyle'));
            // 忽略未提供的字段，也忽略提供了空字符串的字段（防止清空已有内容）
            return provided && value !== '';
        });

        if (!fieldValues.length) {
            return person;
        }

        const now = nowIso();
        const assignments = fieldValues.map(([field]) => `${field} = ?`).join(', ');
        const values = fieldValues.map(([, value]) => value);
        this.db.prepare(`
            UPDATE persons
            SET ${assignments},
                updated_at = ?
            WHERE id = ?
        `).run(...values, now, normalizedPersonId);

        return this.getPerson(normalizedPersonId);
    }

    bindPersonRuntimeRole(personId, payload = {}) {
        const normalizedPersonId = normalizeText(personId);
        const roleId = normalizeText(payload.role_id ?? payload.roleId);
        if (!normalizedPersonId) {
            throw new Error('person_id is required');
        }
        if (!roleId) {
            throw new Error('role_id is required');
        }

        const person = this.getPerson(normalizedPersonId);
        if (!person) {
            throw new Error(`person not found: ${personId}`);
        }

        const now = nowIso();
        const roleName = normalizeText(payload.role_name ?? payload.roleName) || person.display_name;
        const previousRoleId = normalizeText(person.legacy_role_id);

        const tx = this.db.transaction(() => {
            if (previousRoleId && previousRoleId !== roleId) {
                this.db.prepare(`
                    UPDATE team_members
                    SET enabled = 0
                    WHERE role_id = ?
                      AND team_id IN (
                          SELECT team_id
                          FROM team_person_members
                          WHERE person_id = ?
                            AND enabled = 1
                      )
                `).run(previousRoleId, normalizedPersonId);

                this.db.prepare(`
                    UPDATE group_profile_members
                    SET enabled = 0
                    WHERE role_id = ?
                      AND profile_id IN (
                          SELECT profile_id
                          FROM group_person_members
                          WHERE person_id = ?
                            AND enabled = 1
                      )
                `).run(previousRoleId, normalizedPersonId);
            }

            this.db.prepare(`
                UPDATE persons
                SET legacy_role_id = ?,
                    updated_at = ?
                WHERE id = ?
            `).run(roleId, now, normalizedPersonId);

            this.db.prepare(`
                UPDATE team_person_members
                SET legacy_role_id = ?
                WHERE person_id = ?
                  AND enabled = 1
            `).run(roleId, normalizedPersonId);

            this.db.prepare(`
                UPDATE group_person_members
                SET legacy_role_id = ?
                WHERE person_id = ?
                  AND enabled = 1
            `).run(roleId, normalizedPersonId);

            const teamMembers = this.db.prepare(`
                SELECT team_id, person_name, member_order
                FROM team_person_members
                WHERE person_id = ?
                  AND enabled = 1
            `).all(normalizedPersonId);
            for (const member of teamMembers) {
                this.db.prepare(`
                    INSERT INTO team_members (team_id, role_id, role_name, role_order, enabled)
                    VALUES (?, ?, ?, ?, 1)
                    ON CONFLICT(team_id, role_id)
                    DO UPDATE SET
                        role_name = excluded.role_name,
                        role_order = excluded.role_order,
                        enabled = 1
                `).run(
                    member.team_id,
                    roleId,
                    normalizeText(member.person_name) || roleName,
                    Number(member.member_order || 0)
                );
            }

            const groupMembers = this.db.prepare(`
                SELECT profile_id, person_name, member_order
                FROM group_person_members
                WHERE person_id = ?
                  AND enabled = 1
            `).all(normalizedPersonId);
            for (const member of groupMembers) {
                this.db.prepare(`
                    INSERT INTO group_profile_members (profile_id, role_id, role_name, role_order, enabled)
                    VALUES (?, ?, ?, ?, 1)
                    ON CONFLICT(profile_id, role_id)
                    DO UPDATE SET
                        role_name = excluded.role_name,
                        role_order = excluded.role_order,
                        enabled = 1
                `).run(
                    member.profile_id,
                    roleId,
                    normalizeText(member.person_name) || roleName,
                    Number(member.member_order || 0)
                );
            }
        });
        tx();

        return this.getPerson(normalizedPersonId);
    }

    addTeamPersonMember(teamId, personId, options = {}) {
        const person = this.getPerson(personId);
        if (!person) {
            throw new Error(`person not found: ${personId}`);
        }
        const normalizedTeamId = normalizeText(teamId);
        const personName = normalizeText(options.person_name ?? options.personName) || person.display_name;
        const memberOrder = Number(options.member_order ?? options.memberOrder ?? 0);
        const legacyRoleId = normalizeText(options.legacy_role_id ?? options.legacyRoleId) || person.legacy_role_id;

        const tx = this.db.transaction(() => {
            this.db.prepare(`
                INSERT INTO team_person_members
                (team_id, person_id, person_name, member_order, enabled, legacy_role_id)
                VALUES (?, ?, ?, ?, 1, ?)
                ON CONFLICT(team_id, person_id)
                DO UPDATE SET
                    person_name = excluded.person_name,
                    member_order = excluded.member_order,
                    enabled = 1,
                    legacy_role_id = excluded.legacy_role_id
            `).run(
                normalizedTeamId,
                person.id,
                personName,
                memberOrder,
                legacyRoleId
            );

            if (legacyRoleId) {
                this.db.prepare(`
                    INSERT INTO team_members (team_id, role_id, role_name, role_order, enabled)
                    VALUES (?, ?, ?, ?, 1)
                    ON CONFLICT(team_id, role_id)
                    DO UPDATE SET
                        role_name = excluded.role_name,
                        role_order = excluded.role_order,
                        enabled = 1
                `).run(
                    normalizedTeamId,
                    legacyRoleId,
                    normalizeText(options.legacy_role_name ?? options.legacyRoleName) || personName,
                    memberOrder
                );
            }
        });
        tx();

        return this.listTeamPersonMembers(teamId);
    }

    listTeamPersonMembers(teamId) {
        const rows = this.db.prepare(`
            SELECT *
            FROM team_person_members
            WHERE team_id = ?
              AND enabled = 1
            ORDER BY member_order ASC, person_name ASC
        `).all(normalizeText(teamId));
        const personMap = this.getPersonsByIds([...new Set(rows.map(r => r.person_id))]);
        return rows.map(row => ({
            team_id: row.team_id,
            person_id: row.person_id,
            person_name: row.person_name,
            member_order: Number(row.member_order || 0),
            enabled: Boolean(row.enabled),
            legacy_role_id: row.legacy_role_id || null,
            person: personMap.get(row.person_id) || null
        }));
    }

    listTeamPersonMembersByTeamId(teamIds = null) {
        const ids = Array.isArray(teamIds) && teamIds.length
            ? [...new Set(teamIds.map(id => normalizeText(id)).filter(Boolean))]
            : this.db.prepare('SELECT id FROM teams ORDER BY created_at ASC').all().map(row => row.id);

        const buckets = ids.reduce((acc, teamId) => {
            acc[teamId] = [];
            return acc;
        }, {});
        if (!ids.length) return buckets;

        const placeholders = ids.map(() => '?').join(', ');
        const rows = this.db.prepare(`
            SELECT *
            FROM team_person_members
            WHERE team_id IN (${placeholders})
              AND enabled = 1
            ORDER BY team_id ASC, member_order ASC, person_name ASC
        `).all(...ids);

        const personMap = this.getPersonsByIds([...new Set(rows.map(r => r.person_id))]);

        for (const row of rows) {
            if (!buckets[row.team_id]) buckets[row.team_id] = [];
            buckets[row.team_id].push({
                team_id: row.team_id,
                person_id: row.person_id,
                person_name: row.person_name,
                member_order: Number(row.member_order || 0),
                enabled: Boolean(row.enabled),
                legacy_role_id: row.legacy_role_id || null,
                person: personMap.get(row.person_id) || null
            });
        }

        return buckets;
    }

    removeTeamPersonMember(teamId, personId) {
        const normalizedTeamId = normalizeText(teamId);
        const normalizedPersonId = normalizeText(personId);
        if (!normalizedTeamId || !normalizedPersonId) {
            throw new Error('team_id and person_id are required');
        }

        const person = this.getPerson(normalizedPersonId);
        const member = this.db.prepare(`
            SELECT legacy_role_id
            FROM team_person_members
            WHERE team_id = ? AND person_id = ?
        `).get(normalizedTeamId, normalizedPersonId);
        const legacyRoleId = normalizeText(member?.legacy_role_id) || person?.legacy_role_id || null;

        const tx = this.db.transaction(() => {
            this.db.prepare(`
                UPDATE team_person_members
                SET enabled = 0
                WHERE team_id = ? AND person_id = ?
            `).run(normalizedTeamId, normalizedPersonId);

            this.db.prepare(`
                UPDATE group_person_members
                SET enabled = 0
                WHERE person_id = ?
                  AND profile_id IN (
                      SELECT id
                      FROM group_profiles
                      WHERE team_id = ?
                  )
            `).run(normalizedPersonId, normalizedTeamId);

            if (legacyRoleId) {
                this.db.prepare(`
                    UPDATE team_members
                    SET enabled = 0
                    WHERE team_id = ? AND role_id = ?
                `).run(normalizedTeamId, legacyRoleId);

                this.db.prepare(`
                    UPDATE group_profile_members
                    SET enabled = 0
                    WHERE role_id = ?
                      AND profile_id IN (
                          SELECT id
                          FROM group_profiles
                          WHERE team_id = ?
                      )
                `).run(legacyRoleId, normalizedTeamId);
            }
        });
        tx();

        return this.listTeamPersonMembers(normalizedTeamId);
    }

    addGroupPersonMember(profileId, personId, options = {}) {
        const person = this.getPerson(personId);
        if (!person) {
            throw new Error(`person not found: ${personId}`);
        }
        const normalizedProfileId = normalizeText(profileId);
        const personName = normalizeText(options.person_name ?? options.personName) || person.display_name;
        const groupAlias = normalizeText(options.group_alias ?? options.groupAlias) || person.display_name;
        const memberOrder = Number(options.member_order ?? options.memberOrder ?? 0);
        const legacyRoleId = normalizeText(options.legacy_role_id ?? options.legacyRoleId) || person.legacy_role_id;
        const profile = this.db.prepare('SELECT id, team_id FROM group_profiles WHERE id = ?')
            .get(normalizedProfileId);

        const tx = this.db.transaction(() => {
            this.db.prepare(`
                INSERT INTO group_person_members
                (profile_id, person_id, person_name, group_alias, member_order, enabled, speaking_policy_json, legacy_role_id)
                VALUES (?, ?, ?, ?, ?, 1, ?, ?)
                ON CONFLICT(profile_id, person_id)
                DO UPDATE SET
                    person_name = excluded.person_name,
                    group_alias = excluded.group_alias,
                    member_order = excluded.member_order,
                    enabled = 1,
                    speaking_policy_json = excluded.speaking_policy_json,
                    legacy_role_id = excluded.legacy_role_id
            `).run(
                normalizedProfileId,
                person.id,
                personName,
                groupAlias,
                memberOrder,
                safeJsonStringify(options.speaking_policy ?? options.speakingPolicy ?? {}),
                legacyRoleId
            );

            if (legacyRoleId) {
                if (profile?.team_id) {
                    this.db.prepare(`
                        INSERT INTO team_person_members
                        (team_id, person_id, person_name, member_order, enabled, legacy_role_id)
                        VALUES (?, ?, ?, ?, 1, ?)
                        ON CONFLICT(team_id, person_id)
                        DO UPDATE SET
                            person_name = excluded.person_name,
                            member_order = excluded.member_order,
                            enabled = 1,
                            legacy_role_id = excluded.legacy_role_id
                    `).run(
                        profile.team_id,
                        person.id,
                        personName,
                        memberOrder,
                        legacyRoleId
                    );

                    this.db.prepare(`
                        INSERT INTO team_members (team_id, role_id, role_name, role_order, enabled)
                        VALUES (?, ?, ?, ?, 1)
                        ON CONFLICT(team_id, role_id)
                        DO UPDATE SET
                            role_name = excluded.role_name,
                            role_order = excluded.role_order,
                            enabled = 1
                    `).run(
                        profile.team_id,
                        legacyRoleId,
                        normalizeText(options.legacy_role_name ?? options.legacyRoleName) || personName,
                        memberOrder
                    );
                }

                this.db.prepare(`
                    INSERT INTO group_profile_members (profile_id, role_id, role_name, role_order, enabled)
                    VALUES (?, ?, ?, ?, 1)
                    ON CONFLICT(profile_id, role_id)
                    DO UPDATE SET
                        role_name = excluded.role_name,
                        role_order = excluded.role_order,
                        enabled = 1
                `).run(
                    normalizedProfileId,
                    legacyRoleId,
                    normalizeText(options.legacy_role_name ?? options.legacyRoleName) || personName,
                    memberOrder
                );
            }
        });
        tx();

        return this.listGroupPersonMembers(profileId);
    }

    getPersonsByIds(ids) {
        if (!ids.length) return new Map();
        const placeholders = ids.map(() => '?').join(', ');
        return new Map(
            this.db.prepare(`SELECT * FROM persons WHERE id IN (${placeholders})`).all(...ids)
                .map(row => [row.id, this.normalizePersonRow(row)])
        );
    }

    listGroupPersonMembers(profileId) {
        const rows = this.db.prepare(`
            SELECT *
            FROM group_person_members
            WHERE profile_id = ?
              AND enabled = 1
            ORDER BY member_order ASC, person_name ASC
        `).all(normalizeText(profileId));
        const personMap = this.getPersonsByIds([...new Set(rows.map(r => r.person_id))]);
        return rows.map(row => this.normalizeGroupPersonMemberRow(row, personMap));
    }

    normalizeGroupPersonMemberRow(row, personMap = null) {
        return {
            profile_id: row.profile_id,
            person_id: row.person_id,
            person_name: row.person_name,
            group_alias: row.group_alias || '',
            member_order: Number(row.member_order || 0),
            enabled: Boolean(row.enabled),
            speaking_policy: safeJsonParse(row.speaking_policy_json, {}),
            legacy_role_id: row.legacy_role_id || null,
            person: personMap ? (personMap.get(row.person_id) || null) : this.getPerson(row.person_id)
        };
    }

    listGroupPersonMembersByProfileId(profileIds = null) {
        const ids = Array.isArray(profileIds) && profileIds.length
            ? [...new Set(profileIds.map(id => normalizeText(id)).filter(Boolean))]
            : this.db.prepare('SELECT id FROM group_profiles ORDER BY created_at ASC').all().map(row => row.id);
        const buckets = ids.reduce((acc, profileId) => {
            acc[profileId] = [];
            return acc;
        }, {});
        if (!ids.length) {
            return buckets;
        }

        const placeholders = ids.map(() => '?').join(', ');
        const rows = this.db.prepare(`
            SELECT *
            FROM group_person_members
            WHERE profile_id IN (${placeholders})
              AND enabled = 1
            ORDER BY profile_id ASC, member_order ASC, person_name ASC
        `).all(...ids);

        const personMap = this.getPersonsByIds([...new Set(rows.map(r => r.person_id))]);

        for (const row of rows) {
            const member = this.normalizeGroupPersonMemberRow(row, personMap);
            if (!buckets[member.profile_id]) {
                buckets[member.profile_id] = [];
            }
            buckets[member.profile_id].push(member);
        }

        return buckets;
    }

    removeGroupPersonMember(profileId, personId) {
        const normalizedProfileId = normalizeText(profileId);
        const normalizedPersonId = normalizeText(personId);
        if (!normalizedProfileId || !normalizedPersonId) {
            throw new Error('profile_id and person_id are required');
        }

        const person = this.getPerson(normalizedPersonId);
        const member = this.db.prepare(`
            SELECT legacy_role_id
            FROM group_person_members
            WHERE profile_id = ? AND person_id = ?
        `).get(normalizedProfileId, normalizedPersonId);
        const legacyRoleId = normalizeText(member?.legacy_role_id) || person?.legacy_role_id || null;

        const tx = this.db.transaction(() => {
            this.db.prepare(`
                UPDATE group_person_members
                SET enabled = 0
                WHERE profile_id = ? AND person_id = ?
            `).run(normalizedProfileId, normalizedPersonId);

            if (legacyRoleId) {
                this.db.prepare(`
                    UPDATE group_profile_members
                    SET enabled = 0
                    WHERE profile_id = ? AND role_id = ?
                `).run(normalizedProfileId, legacyRoleId);
            }
        });
        tx();

        return this.listGroupPersonMembers(normalizedProfileId);
    }

    moveGroupPersonMember(profileId, personId, direction) {
        const normalizedProfileId = normalizeText(profileId);
        const normalizedPersonId = normalizeText(personId);
        const normalizedDirection = normalizeText(direction).toLowerCase();
        if (!normalizedProfileId || !normalizedPersonId) {
            throw new Error('profile_id and person_id are required');
        }
        if (!['up', 'down'].includes(normalizedDirection)) {
            throw new Error('direction must be up or down');
        }

        const enabledMembers = this.db.prepare(`
            SELECT *
            FROM group_person_members
            WHERE profile_id = ?
              AND enabled = 1
            ORDER BY member_order ASC, person_name ASC
        `).all(normalizedProfileId);

        const index = enabledMembers.findIndex(member => member.person_id === normalizedPersonId);
        if (index < 0) {
            throw new Error(`group person member not found: ${personId}`);
        }

        const targetIndex = normalizedDirection === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= enabledMembers.length) {
            return this.listGroupPersonMembers(normalizedProfileId);
        }

        const reordered = [...enabledMembers];
        const [moved] = reordered.splice(index, 1);
        reordered.splice(targetIndex, 0, moved);

        const updateGroupPersonOrder = this.db.prepare(`
            UPDATE group_person_members
            SET member_order = ?
            WHERE profile_id = ? AND person_id = ?
        `);
        const updateRuntimeOrder = this.db.prepare(`
            UPDATE group_profile_members
            SET role_order = ?
            WHERE profile_id = ? AND role_id = ?
        `);

        const tx = this.db.transaction(items => {
            items.forEach((member, itemIndex) => {
                const nextOrder = (itemIndex + 1) * 10;
                updateGroupPersonOrder.run(nextOrder, normalizedProfileId, member.person_id);
                const legacyRoleId = normalizeText(member.legacy_role_id);
                if (legacyRoleId) {
                    updateRuntimeOrder.run(nextOrder, normalizedProfileId, legacyRoleId);
                }
            });
        });
        tx(reordered);

        return this.listGroupPersonMembers(normalizedProfileId);
    }
}

module.exports = PersonIdentityService;
