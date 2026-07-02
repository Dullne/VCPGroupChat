export const ROLE_STUDIO_CONTEXT_NONE = 'none';
export const ROLE_STUDIO_CONTEXT_GROUP_PROFILE = 'group_profile';

export function normalizeRoleStudioContextMode(value) {
    return String(value || '').trim() === ROLE_STUDIO_CONTEXT_GROUP_PROFILE
        ? ROLE_STUDIO_CONTEXT_GROUP_PROFILE
        : ROLE_STUDIO_CONTEXT_NONE;
}

export function usesGroupProfileContext(value) {
    return normalizeRoleStudioContextMode(value) === ROLE_STUDIO_CONTEXT_GROUP_PROFILE;
}

export function describeRoleStudioContextMode(value, options = {}) {
    if (usesGroupProfileContext(value)) {
        const profileName = String(options.profile?.name || '').trim() || '当前群组';
        return `参考群组：${profileName}。生成时会参考群组章程和已在场人物，用来补位。`;
    }

    return '参考范围：不参考群组或会话，生成可复用的长期人物草稿。';
}
