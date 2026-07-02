function normalizeText(value) {
    return String(value ?? '').trim();
}

const NOTEBOOK_TYPE_PRIVATE = 'private';
const NOTEBOOK_TYPE_KNOWLEDGE = 'knowledge';

/**
 * 与 VCPToolBox DailyNote 插件 sanitizePathComponent 对齐的片段清洗。
 * notebook_id 既作日记文件夹名又作向量索引 diary_name，必须经写入侧 sanitize 后不变，
 * 因此生成时就预先清洗，保证读（path.join 原样使用）写（sanitize 不变）两侧一致。
 */
function sanitizeNotebookSegment(name) {
    return String(name ?? '')
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/[\x00-\x1f\x7f]/g, '')
        .replace(/[‎‏‪-‮⁦-⁩]/g, '')
        .replace(/[​-‍﻿]/g, '')
        .replace(/\s+/g, '_')
        .replace(/^[._]+|[._]+$/g, '')
        .replace(/_+/g, '_')
        .slice(0, 100);
}

/**
 * Display-name accessors (kept for UI / content 署名).
 * 命名空间键请改用 resolveNotebookId / getPersonNotebookId。
 */
function getPersonPrivateNotebook(person) {
    return normalizeText(
        person?.memory?.privateNotebook
        || person?.memory?.private_notebook
        || person?.private_notebook
        || person?.display_name
    );
}

function getPersonKnowledgeNotebook(person) {
    return normalizeText(
        person?.memory?.knowledgeNotebook
        || person?.memory?.knowledge_notebook
        || person?.knowledge_notebook
        || ''
    );
}

/**
 * 派生 person 作用域的 notebook_id（VCPToolBox 日记文件夹 / 向量索引命名空间）。
 * 用 `-` 分隔，segment 经 sanitizeNotebookSegment 清洗，确保写入侧 sanitize 后不变。
 * private   → person-{personId}-private
 * knowledge → person-{personId}-knowledge
 * 缺 personId 时回退到 legacy-{roleId}-{type}（过渡期兼容）。
 */
function getPersonNotebookId(person, type = NOTEBOOK_TYPE_PRIVATE) {
    const personId = normalizeText(person?.id);
    const normalizedType = type === NOTEBOOK_TYPE_KNOWLEDGE ? NOTEBOOK_TYPE_KNOWLEDGE : NOTEBOOK_TYPE_PRIVATE;
    if (personId) {
        return `person-${sanitizeNotebookSegment(personId)}-${normalizedType}`;
    }
    const legacyRoleId = normalizeText(person?.legacy_role_id);
    if (legacyRoleId) {
        return `legacy-${sanitizeNotebookSegment(legacyRoleId)}-${normalizedType}`;
    }
    return '';
}

function getSharedNotebookId(notebookName) {
    const name = sanitizeNotebookSegment(notebookName);
    return name ? `shared-${name}` : '';
}

/**
 * 统一的 notebook_id 解析器。candidate 字段与 memory candidate 对齐：
 *   scope: 'private' | 'knowledge' | 'shared' | 'project'
 *   target_person_id / target_role_id / notebook
 * context 提供 getPerson(id) 与 getPersonByLegacyRoleId(roleId)。
 */
function resolveNotebookId(candidate = {}, context = {}) {
    const scope = normalizeText(candidate.scope || 'shared').toLowerCase() || 'shared';

    if (scope === 'shared' || scope === 'project') {
        // v1：共享本保持显示名命名空间（authored group_prompt 占位符依赖显示名，共享本无需 per-person 隔离）。
        return normalizeText(candidate.notebook) || '公共';
    }

    const type = scope === NOTEBOOK_TYPE_KNOWLEDGE ? NOTEBOOK_TYPE_KNOWLEDGE : NOTEBOOK_TYPE_PRIVATE;

    const targetPersonId = normalizeText(candidate.target_person_id ?? candidate.targetPersonId);
    if (targetPersonId) {
        const person = context.getPerson?.(targetPersonId) || null;
        if (person) {
            return getPersonNotebookId(person, type);
        }
        // person 未解析到时仍按 id 派生，保证写入侧命名空间稳定
        return `person-${sanitizeNotebookSegment(targetPersonId)}-${type}`;
    }

    const targetRoleId = normalizeText(candidate.target_role_id ?? candidate.targetRoleId);
    if (targetRoleId) {
        const legacyPerson = context.getPersonByLegacyRoleId?.(targetRoleId) || null;
        if (legacyPerson) {
            return getPersonNotebookId(legacyPerson, type);
        }
        return `legacy-${sanitizeNotebookSegment(targetRoleId)}-${type}`;
    }

    return '';
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
    getPersonKnowledgeNotebook,
    getPersonNotebookId,
    getSharedNotebookId,
    resolveNotebookId,
    resolveMemoryOwner
};
