export function buildRoleLibraryImportItemBadges(item, deps) {
    const {
        isRoleInManagedTeam,
        isRoleInManagedProfile
    } = deps;

    const badges = [];
    badges.push('人物模板');
    if (item.tag) {
        badges.push(item.tag);
    }
    if (item.voice_style && item.voice_style.length <= 24) {
        badges.push(item.voice_style);
    }

    const runtimeRoleId = item.runtime_role_id || null;
    if (runtimeRoleId && isRoleInManagedTeam(runtimeRoleId)) {
        badges.push('团队成员');
    }
    if (runtimeRoleId && isRoleInManagedProfile(runtimeRoleId)) {
        badges.push('群组成员');
    }

    return badges;
}
