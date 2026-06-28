function normalizeText(value) {
    return String(value ?? '').trim();
}

function extractMessageText(message = {}) {
    const content = message.content;
    if (typeof content === 'string') {
        return content.trim();
    }
    if (Array.isArray(content)) {
        return content
            .filter(item => item && item.type === 'text' && typeof item.text === 'string')
            .map(item => item.text.trim())
            .filter(Boolean)
            .join('\n');
    }
    if (content && typeof content === 'object') {
        return String(content.text || '').trim();
    }
    return '';
}

function summarizeInline(value, maxLength = 180) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) {
        return '';
    }
    return text.length > maxLength ? `${text.slice(0, maxLength - 1).trim()}...` : text;
}

function getRoleMemory(role = {}) {
    if (!role || typeof role !== 'object') {
        return null;
    }
    if (role.memory && typeof role.memory === 'object') {
        return role.memory;
    }
    if (role.role_spec?.memory && typeof role.role_spec.memory === 'object') {
        return role.role_spec.memory;
    }
    return null;
}

function getPersonMemory(person = {}) {
    if (!person || typeof person !== 'object') {
        return null;
    }
    if (person.memory && typeof person.memory === 'object') {
        return person.memory;
    }
    return null;
}

function buildRoleLookup(roles = []) {
    const byId = new Map();
    const byName = new Map();
    for (const role of Array.isArray(roles) ? roles : []) {
        if (!role || typeof role !== 'object') {
            continue;
        }
        if (role.id) {
            byId.set(String(role.id), role);
        }
        if (role.name) {
            byName.set(String(role.name), role);
        }
    }
    return { byId, byName };
}

function buildPersonLookup(persons = []) {
    const byId = new Map();
    const byName = new Map();
    for (const person of Array.isArray(persons) ? persons : []) {
        if (!person || typeof person !== 'object') {
            continue;
        }
        if (person.id) {
            byId.set(String(person.id), person);
        }
        if (person.display_name) {
            byName.set(String(person.display_name), person);
        }
    }
    return { byId, byName };
}

function resolveCandidateTarget(message, roleLookup, personLookup = buildPersonLookup()) {
    const person = personLookup.byId.get(String(message.speaker_person_id || ''))
        || personLookup.byName.get(String(message.speaker_name || ''))
        || null;
    const personMemory = getPersonMemory(person);
    const personPrivateNotebook = normalizeText(
        personMemory?.privateNotebook
        || personMemory?.private_notebook
        || person?.private_notebook
        || person?.display_name
    );

    if (person && personPrivateNotebook) {
        return {
            scope: 'private',
            notebook: personPrivateNotebook,
            target_person_id: person.id,
            target_membership_id: message.speaker_membership_id || null,
            memory_owner_type: 'person',
            memory_owner_id: person.id,
            reason: '来自最近人物回复，默认写入该人物私有记忆；需用户确认后才进入长期记忆写入流程。'
        };
    }

    const role = roleLookup.byId.get(String(message.speaker_id || ''))
        || roleLookup.byName.get(String(message.speaker_name || ''))
        || null;
    const memory = getRoleMemory(role);
    const privateNotebook = normalizeText(memory?.privateNotebook || memory?.private_notebook);

    if (privateNotebook) {
        return {
            scope: 'private',
            notebook: privateNotebook,
            target_person_id: null,
            target_membership_id: null,
            memory_owner_type: 'legacy_role',
            memory_owner_id: message.speaker_id || null,
            reason: '来自最近角色回复，默认写入该角色私有记忆；需用户确认后才进入长期记忆写入流程。'
        };
    }

    return {
        scope: 'shared',
        notebook: '公共',
        target_person_id: null,
        target_membership_id: null,
        memory_owner_type: 'shared',
        memory_owner_id: '公共',
        reason: '来自最近角色回复，需用户确认后才进入长期记忆写入流程。'
    };
}

function buildSessionReflectionDraft(session, options = {}) {
    const messages = Array.isArray(session?.messages) ? session.messages : [];
    const roleLookup = buildRoleLookup(options.roles || []);
    const personLookup = buildPersonLookup(options.persons || []);
    const textMessages = messages
        .map(message => ({
            ...message,
            text: extractMessageText(message)
        }))
        .filter(message => message.text);
    const recentMessages = textMessages.slice(-12);
    const userMessages = textMessages.filter(message => message.role === 'user');
    const assistantMessages = textMessages.filter(message => message.role === 'assistant');
    const latestUser = userMessages.at(-1);
    const speakerNames = [...new Set(
        assistantMessages
            .map(message => message.speaker_name || message.speaker_id)
            .filter(Boolean)
    )];

    const summaryParts = [];
    if (latestUser?.text) {
        summaryParts.push(`最近用户目标：${summarizeInline(latestUser.text, 120)}`);
    }
    if (speakerNames.length) {
        summaryParts.push(`参与角色：${speakerNames.slice(0, 6).join('、')}`);
    }
    if (assistantMessages.length) {
        summaryParts.push(`已产生 ${assistantMessages.length} 条角色回复，可从稳定结论中挑选长期记忆。`);
    }

    const summary = summaryParts.length
        ? summaryParts.join(' ')
        : '当前会话还没有足够内容生成长期记忆候选。';

    const candidates = assistantMessages
        .slice(-6)
        .filter(message => message.text.length >= 30)
        .reverse()
        .slice(0, 3)
        .map(message => {
            const speakerName = message.speaker_name || message.speaker_id || '角色';
            const target = resolveCandidateTarget(message, roleLookup, personLookup);
            return {
                scope: target.scope,
                target_role_id: message.speaker_id || null,
                target_role_name: message.speaker_name || null,
                target_person_id: target.target_person_id || null,
                target_membership_id: target.target_membership_id || null,
                memory_owner_type: target.memory_owner_type || 'legacy_role',
                memory_owner_id: target.memory_owner_id || null,
                notebook: target.notebook,
                content: `${speakerName} 在群聊中形成的可复用结论：${summarizeInline(message.text, 220)}`,
                reason: target.reason
            };
        });

    if (!candidates.length && latestUser?.text && recentMessages.length >= 2) {
        candidates.push({
            scope: 'shared',
            target_role_id: null,
            target_role_name: null,
            target_person_id: null,
            target_membership_id: null,
            memory_owner_type: 'shared',
            memory_owner_id: '公共',
            notebook: '公共',
            content: `当前会话的重要用户目标：${summarizeInline(latestUser.text, 220)}`,
            reason: '会话目标可作为后续协作上下文，但仍需用户确认。'
        });
    }

    return {
        summary,
        source_message_count: textMessages.length,
        candidates
    };
}

module.exports = {
    buildSessionReflectionDraft,
    buildPersonLookup,
    buildRoleLookup,
    resolveCandidateTarget
};
