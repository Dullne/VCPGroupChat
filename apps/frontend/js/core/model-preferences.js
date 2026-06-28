export function resolveManagedTeamIdByTeams(teams = [], preferredTeamId = null) {
    const preferred = String(preferredTeamId || '').trim();
    if (preferred && teams.some(team => team.id === preferred)) {
        return preferred;
    }
    if (teams.length > 0) {
        return teams[0].id;
    }
    return null;
}

export function getRoleStudioModelsFromBootstrap(bootstrapData) {
    return Array.isArray(bootstrapData?.role_studio?.models)
        ? bootstrapData.role_studio.models
            .map(item => String(item || '').trim())
            .filter(Boolean)
        : [];
}

export function getRoleRuntimeModel(role) {
    return String(role?.model || role?.role_spec?.model || '').trim();
}

export function getDisabledRuntimeModelsFromBootstrap(bootstrapData) {
    return Array.isArray(bootstrapData?.groupchat_runtime?.disabled_models)
        ? bootstrapData.groupchat_runtime.disabled_models
            .map(item => String(item || '').trim())
            .filter(Boolean)
        : [];
}

export function isRuntimeModelDisabled(model, bootstrapData) {
    const normalizedModel = String(model || '').trim().toLowerCase();
    if (!normalizedModel) {
        return false;
    }
    return getDisabledRuntimeModelsFromBootstrap(bootstrapData)
        .some(item => item.toLowerCase() === normalizedModel);
}

export function getRoleRuntimeModelStatus(role, bootstrapData) {
    const model = getRoleRuntimeModel(role);
    return {
        model,
        disabled: isRuntimeModelDisabled(model, bootstrapData)
    };
}

export function formatRoleRuntimeModelBadge(role, bootstrapData) {
    const { model, disabled } = getRoleRuntimeModelStatus(role, bootstrapData);
    if (!model) {
        return '默认模型';
    }
    return disabled ? `模型已禁用 ${model}` : `模型 ${model}`;
}

export function formatRoleRuntimeModelSummary(role, bootstrapData) {
    const { model, disabled } = getRoleRuntimeModelStatus(role, bootstrapData);
    if (!model) {
        return '运行模型：核心默认';
    }
    return disabled
        ? `运行模型：${model}（已禁用，运行时自动回退）`
        : `运行模型：${model}`;
}

export function getRuntimeModelCandidates({ bootstrapData, availableRoles }) {
    const preferredModels = getRoleStudioModelsFromBootstrap(bootstrapData);
    const observedModels = [...(bootstrapData?.roles || []), ...(availableRoles || [])]
        .map(role => getRoleRuntimeModel(role))
        .filter(Boolean);
    const extras = [...new Set(observedModels.filter(model => !preferredModels.includes(model)))]
        .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));

    return [...preferredModels, ...extras];
}
