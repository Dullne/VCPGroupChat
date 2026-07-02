function buildFallbackIntro(draftMeta) {
    if (draftMeta?.fallbackReason === 'llm_backend_unconfigured') {
        return '后端模型接口未配置（GROUPCHAT_LLM_BASE_URL），已使用本地人物草稿兜底。配置 GroupChatBackend 的模型地址后可使用后端人物生成';
    }
    if (draftMeta?.fallbackReason === 'llm_backend_timeout') {
        return '后端人物生成请求超时，已使用本地人物草稿兜底';
    }
    if (draftMeta?.fallbackMessage) {
        return `后端人物生成返回错误，已使用本地人物草稿兜底：${draftMeta.fallbackMessage}`;
    }
    return '后端人物生成暂时不可用，已使用本地人物草稿兜底';
}

function buildSuccessIntro(draft, draftMeta) {
    if (draftMeta?.contextMode === 'group_profile') {
        return `已参考当前群组生成「${draft.name}」补位草稿。`;
    }

    return `已生成独立人物草稿「${draft.name}」。`;
}

export function buildRoleDraftStatusState(deps) {
    const {
        draft,
        draftMeta,
        usedFallback,
        describeRoleDraftGeneration
    } = deps;

    const usesFallbackName = draft.name === '自定义人物';
    const generationStatus = describeRoleDraftGeneration(draftMeta);

    if (usedFallback) {
        const fallbackIntro = buildFallbackIntro(draftMeta);
        return {
            text: usesFallbackName
                ? `${fallbackIntro}。建议先改一个更具体的人物名，再创建人物。`
                : `${fallbackIntro}：${draft.name}。当前草稿可继续创建。`,
            className: 'profile-form-status profile-form-status-warning'
        };
    }

    return {
        text: usesFallbackName
            ? `已生成人物草稿。${generationStatus}但还没有明确人物名。建议先改一个更具体的名字，再创建人物。`
            : `${buildSuccessIntro(draft, draftMeta)}${generationStatus}检查后可保存为长期人物，或先创建临时角色试用。`,
        className: usesFallbackName
            ? 'profile-form-status profile-form-status-warning'
            : 'profile-form-status profile-form-status-ready'
    };
}
