export function buildRoleLibraryImportItemBadges(item, deps) {
    const {
        getImportedRoleIdFromCatalogItem,
        isRoleInManagedTeam,
        isRoleInManagedProfile
    } = deps;

    const badges = [];
    badges.push(item.imported ? '已导入核心' : '未导入');
    if (item.tag) {
        badges.push(item.tag);
    }
    if (item.voice_style && item.voice_style.length <= 24) {
        badges.push(item.voice_style);
    }

    const importedRoleId = getImportedRoleIdFromCatalogItem(item);
    if (item.imported && importedRoleId && isRoleInManagedTeam(importedRoleId)) {
        badges.push('团队成员');
    }
    if (item.imported && importedRoleId && isRoleInManagedProfile(importedRoleId)) {
        badges.push('群组成员');
    }

    return badges;
}
