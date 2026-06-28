function normalizeText(value) {
    return String(value ?? '').trim();
}

function normalizeStringArray(value, maxItems = 8) {
    const raw = Array.isArray(value)
        ? value
        : normalizeText(value)
            .split('\n')
            .map(item => item.trim());

    return [...new Set(
        raw
            .map(item => normalizeText(item).replace(/\s+/g, ' '))
            .filter(Boolean)
    )].slice(0, maxItems);
}

function firstDefined(...values) {
    return values.find(value => value !== undefined && value !== null && value !== '');
}

function pickRuntimePreference(key, person, template, overrides) {
    return firstDefined(
        overrides?.[key],
        overrides?.model_preferences?.[key],
        overrides?.modelPreferences?.[key],
        person?.model_preferences?.[key],
        person?.modelPreferences?.[key],
        template?.defaults?.[key]
    );
}

function pickTextPreference(key, person, template, overrides) {
    return normalizeText(pickRuntimePreference(key, person, template, overrides));
}

function buildPersonaText(person) {
    const lines = [
        person.description ? `人物定位：${person.description}` : null,
        person.personality ? `性格：${person.personality}` : null,
        person.emotional_style ? `情感表达：${person.emotional_style}` : null,
        person.voice_style ? `说话方式：${person.voice_style}` : null
    ];

    return lines.filter(Boolean).join('\n');
}

function buildTemplateProvenance(template) {
    if (!template) {
        return '';
    }

    const sourcePath = [
        normalizeText(template.source),
        normalizeText(template.external_id ?? template.externalId)
    ].filter(Boolean).join('/');

    return [
        `模板来源：${normalizeText(template.name) || template.id}`,
        sourcePath ? `模板路径：${sourcePath}` : null,
        normalizeText(template.description) ? `模板说明：${normalizeText(template.description)}` : null
    ].filter(Boolean).join('\n');
}

function buildTemplateContent({ person, template, privateNotebook }) {
    const sections = [
        [
            `长期人物：${person.display_name}`,
            `人物ID：${person.id}`,
            '身份规则：这是一个唯一且长期存在的人物，不是职业角色模板本身。',
            `人物私有记忆入口：{{${privateNotebook}}}`,
            person.description ? `人物定位：${person.description}` : null,
            person.personality ? `人物性格：${person.personality}` : null,
            person.emotional_style ? `情感风格：${person.emotional_style}` : null,
            person.voice_style ? `表达风格：${person.voice_style}` : null
        ].filter(Boolean).join('\n'),
        buildTemplateProvenance(template),
        normalizeText(template?.template_content ?? template?.templateContent)
    ].filter(Boolean);

    return sections.join('\n\n');
}

function buildPersonRuntimeRoleImportPayload({ person, template = null, overrides = {} } = {}) {
    const normalizedPerson = {
        ...(person || {}),
        id: normalizeText(person?.id),
        display_name: normalizeText(person?.display_name ?? person?.displayName),
        description: normalizeText(person?.description),
        personality: normalizeText(person?.personality),
        emotional_style: normalizeText(person?.emotional_style ?? person?.emotionalStyle),
        voice_style: normalizeText(person?.voice_style ?? person?.voiceStyle),
        memory: person?.memory && typeof person.memory === 'object' ? person.memory : {},
        model_preferences:
            person?.model_preferences && typeof person.model_preferences === 'object'
                ? person.model_preferences
                : person?.modelPreferences || {}
    };

    if (!normalizedPerson.display_name) {
        throw new Error('person display_name is required');
    }

    const privateNotebook = normalizeText(
        normalizedPerson.memory.privateNotebook
        ?? normalizedPerson.memory.private_notebook
        ?? normalizedPerson.display_name
    ) || normalizedPerson.display_name;

    const normalizedTemplate = template
        ? {
            ...template,
            source: normalizeText(template.source),
            name: normalizeText(template.name),
            description: normalizeText(template.description),
            template_content: normalizeText(template.template_content ?? template.templateContent),
            defaults: template.defaults && typeof template.defaults === 'object' ? template.defaults : {}
        }
        : null;

    const responsibilities = normalizeStringArray(
        firstDefined(
            overrides.responsibilities,
            normalizedPerson.responsibilities,
            normalizedTemplate?.defaults?.responsibilities
        )
    );

    return {
        id: normalizeText(overrides.id) || undefined,
        name: normalizedPerson.display_name,
        source: normalizeText(overrides.source) || 'groupchat_person',
        description: normalizedPerson.description || normalizedTemplate?.description || '',
        avatar: normalizeText(overrides.avatar || normalizedPerson.avatar),
        tag: normalizeText(overrides.tag) || '长期人物',
        model: pickTextPreference('model', normalizedPerson, normalizedTemplate, overrides),
        temperature: pickRuntimePreference('temperature', normalizedPerson, normalizedTemplate, overrides),
        max_tokens: pickRuntimePreference('max_tokens', normalizedPerson, normalizedTemplate, overrides),
        output_tokens: pickRuntimePreference('output_tokens', normalizedPerson, normalizedTemplate, overrides),
        context_token_limit: pickRuntimePreference('context_token_limit', normalizedPerson, normalizedTemplate, overrides),
        persona: normalizeText(overrides.persona) || buildPersonaText(normalizedPerson),
        responsibilities,
        collaboration_guide: normalizeText(overrides.collaboration_guide ?? overrides.collaborationGuide)
            || '参考群组里其他成员的发言，保留自己的观察和判断，只输出有增量的信息。',
        voice_style: normalizeText(overrides.voice_style ?? overrides.voiceStyle)
            || normalizedPerson.voice_style
            || normalizedPerson.emotional_style,
        memory: {
            ...normalizedPerson.memory,
            privateNotebook,
            owner_type: 'person',
            owner_id: normalizedPerson.id || normalizedPerson.display_name
        },
        invite_prompt:
            normalizeText(overrides.invite_prompt ?? overrides.invitePrompt)
            || `接下来请作为${normalizedPerson.display_name}发言。参考前文和其他成员观点，但保持你作为长期人物的独立判断。`,
        template_content: buildTemplateContent({
            person: normalizedPerson,
            template: normalizedTemplate,
            privateNotebook
        })
    };
}

module.exports = {
    buildPersonRuntimeRoleImportPayload
};
