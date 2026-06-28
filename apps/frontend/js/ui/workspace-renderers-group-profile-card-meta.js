export function buildWorkspaceGroupProfileBadges(profile, deps) {
    const {
        bootstrapData,
        managedProfile,
        sessionProfile,
        getProfileModeLabel
    } = deps;

    return [
        profile.id === bootstrapData?.default_profile_id ? '默认模板' : '',
        managedProfile?.id === profile.id ? '当前管理' : '',
        sessionProfile?.id === profile.id ? '当前会话' : '',
        getProfileModeLabel(profile.mode),
        `${(profile.members || []).filter(member => member.enabled).length} 成员`,
        `${Number(profile.session_count || 0)} 会话`
    ];
}

export function buildWorkspaceGroupProfileMemberMeta(profile) {
    return `成员：${(profile.members || [])
        .filter(member => member.enabled)
        .map(member => member.role_name || member.role_id)
        .join('、') || '暂无成员'}`;
}
