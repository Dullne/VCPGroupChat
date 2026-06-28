export function normalizeRoleDraftMeta(meta) {
    const source = String(meta?.source || '').trim();
    const model = String(meta?.model || '').trim();
    const selectedModel = String(meta?.selected_model || meta?.selectedModel || '').trim();
    const requestedModel = String(meta?.requested_model || meta?.requestedModel || '').trim();
    const profileName = String(meta?.profile_name || meta?.profileName || '').trim();
    const sessionId = String(meta?.session_id || meta?.sessionId || '').trim();
    const engine = String(meta?.engine || meta?.generation_engine || meta?.generationEngine || '').trim();
    const promptxFiles = Array.isArray(meta?.promptx_files || meta?.promptxFiles)
        ? (meta.promptx_files || meta.promptxFiles).map(item => String(item || '').trim()).filter(Boolean)
        : [];
    const agencyReferences = Array.isArray(meta?.agency_references || meta?.agencyReferences)
        ? (meta.agency_references || meta.agencyReferences).filter(Boolean)
        : [];

    if (!source && !model && !selectedModel && !requestedModel && !profileName && !sessionId && !engine && !promptxFiles.length && !agencyReferences.length) {
        return null;
    }

    return {
        source,
        model,
        selectedModel,
        requestedModel,
        profileName,
        sessionId,
        engine,
        promptxFiles,
        agencyReferences
    };
}

export function describeRoleDraftGeneration(meta) {
    if (meta?.requestedModel && meta?.selectedModel && meta.requestedModel !== meta.selectedModel) {
        return `优先模型 ${meta.requestedModel} 不可用，已自动回退到 ${meta.model || meta.selectedModel}。`;
    }
    if (!meta?.model) {
        return '';
    }
    const engineText = meta.engine ? `生成引擎：${meta.engine}；` : '';
    return `${engineText}当前生成模型：${meta.model}。`;
}

export function buildRoleDraftMetaLabels(meta) {
    if (!meta) {
        return [];
    }

    const labels = [];
    if (meta.source === 'llm') {
        labels.push('草稿来源：后端模型');
    } else if (meta.source === 'fallback') {
        labels.push('草稿来源：本地兜底');
    } else if (meta.source) {
        labels.push(`草稿来源：${meta.source}`);
    }

    if (meta.requestedModel && meta.selectedModel && meta.requestedModel !== meta.selectedModel) {
        labels.push(`优先模型：${meta.requestedModel}`);
    }

    if (meta.model) {
        labels.push(`生成模型：${meta.model}`);
    }

    if (meta.engine) {
        labels.push(translateUiText(`生成引擎：${meta.engine}`));
    }

    if (meta.promptxFiles?.length) {
        labels.push(translateUiText(`PromptX 方法论：${meta.promptxFiles.length} 个文件`));
    }

    if (meta.agencyReferences?.length) {
        labels.push(translateUiText(`agency 参考：${meta.agencyReferences.map(item => item.name || item.id).filter(Boolean).slice(0, 3).join('、')}`));
    }

    if (meta.profileName) {
        labels.push(translateUiText(`上下文模板：${meta.profileName}`));
    }

    return labels;
}
