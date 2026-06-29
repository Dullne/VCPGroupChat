function buildFallbackIntro(draftMeta) {
    if (draftMeta?.fallbackReason === 'llm_backend_unconfigured') {
        return '后端模型接口未配置（GROUPCHAT_LLM_BASE_URL），已使用本地草稿兜底。配置 GroupChatBackend 的模型地址后可使用后端创角';
    }
    if (draftMeta?.fallbackReason === 'llm_backend_timeout') {
        return '后端创角请求超时，已使用本地草稿兜底';
    }
    if (draftMeta?.fallbackMessage) {
        return `后端创角返回错误，已使用本地草稿兜底：${draftMeta.fallbackMessage}`;
    }
    return '后端创角暂时不可用，已使用本地草稿兜底';
}

export function buildRoleDraftStatusState(deps) {
    const {
        draft,
        draftMeta,
        usedFallback,
        describeRoleDraftGeneration
    } = deps;

    const usesFallbackName = draft.name === '自定义角色';
    const generationStatus = describeRoleDraftGeneration(draftMeta);

    if (usedFallback) {
        const fallbackIntro = buildFallbackIntro(draftMeta);
        return {
            text: usesFallbackName
                ? `${fallbackIntro}。建议先改一个更具体的角色名，再创建角色。`
                : `${fallbackIntro}：${draft.name}。当前草稿可继续创建。`,
            className: 'profile-form-status profile-form-status-warning'
        };
    }

    return {
        text: usesFallbackName
            ? `已生成角色草稿。${generationStatus}但还没有明确角色名。建议先改一个更具体的名字，再创建角色。`
            : `已根据一句话生成「${draft.name}」的角色草稿。${generationStatus}检查后可直接创建临时角色。`,
        className: usesFallbackName
            ? 'profile-form-status profile-form-status-warning'
            : 'profile-form-status profile-form-status-ready'
    };
}
