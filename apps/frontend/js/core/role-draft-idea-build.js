import { suggestRoleNameFromIdea } from './role-draft-idea-name.js';
import { deriveResponsibilitiesFromIdea } from './role-draft-idea-responsibilities.js';

export function buildRoleDraftFromIdea(idea) {
    const normalizedIdea = String(idea || '').replace(/\s+/g, ' ').trim();
    const name = suggestRoleNameFromIdea(normalizedIdea);
    const responsibilities = deriveResponsibilitiesFromIdea(normalizedIdea);

    return {
        name,
        privateNotebook: name,
        knowledgeNotebook: `${name}的知识`,
        description: normalizedIdea,
        persona: `你是${name}。${normalizedIdea}。在群聊协作中，请优先识别问题结构、明确你的专业边界，并只输出对当前讨论有增量价值的内容。`,
        responsibilities,
        collaborationGuide: '优先补位，不重复团队中已有人物的职责；如果信息不足，先补关键假设，再给出可执行建议。',
        voiceStyle: '',
        invitePrompt: `接下来请作为${name}发言。优先按照你的职责范围回答，不要输出额外聊天标识头。`,
        model: '',
        template: [
            `人物名称：${name}`,
            `用户需求：${normalizedIdea}`,
            '',
            '协作要求：',
            '- 优先拆解问题，再给出判断与建议',
            '- 只回答自己最擅长的部分，不重复其他人物',
            '- 遇到信息不足时先补关键假设或澄清点',
            '- 回答应尽量具体、可执行、可交接',
            '- 重要结论优先沉淀到私有记忆，并在需要时与共享记忆协作'
        ].join('\n')
    };
}
