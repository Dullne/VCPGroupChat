import { translateUiText } from './i18n.js';
export function buildRoleStudioModelMeta(availableModels, activeValue) {
    if (!availableModels.length) {
        return translateUiText('当前前端还没拿到模型池配置，创角请求会直接交给后端默认策略。');
    }

    const template = activeValue
        ? `当前指定优先模型：${activeValue}。如果该模型不可用，后端会自动回退到其他可用快模型。`
        : `当前后端可用 ${availableModels.length} 个创角模型，默认按服务端优先级自动选择并回退。`;
    return translateUiText(template);
}

export function buildRuntimeModelMeta(availableModels, currentValue) {
    if (!availableModels.length) {
        return translateUiText('当前没有可参考的运行模型候选，留空时将走核心默认模型。');
    }

    const template = currentValue
        ? `当前角色将固定使用：${currentValue}。如果留空，则改为走 VCP 核心默认角色模型。`
        : `当前可快速切换 ${availableModels.length} 个运行模型。留空表示不在角色上绑定模型。`;
    return translateUiText(template);
}
