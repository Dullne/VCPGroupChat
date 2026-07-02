export function splitRoleTags(value) {
    return String(value || '')
        .split(/[,\s，、;；|/]+/)
        .map(item => item.trim())
        .filter(Boolean);
}

export function getRoleMentionAliases(role) {
    const aliases = new Set();
    if (role?.name) {
        aliases.add(String(role.name).trim());
    }
    for (const tag of splitRoleTags(role?.tag || role?.role_spec?.tag || '')) {
        aliases.add(tag);
    }
    return [...aliases];
}

export function getMentionedRoleIdsFromText(text, roles = []) {
    const content = String(text || '');
    const mentioned = new Set();

    for (const role of roles) {
        for (const alias of getRoleMentionAliases(role)) {
            if (alias && content.includes(`@${alias}`)) {
                mentioned.add(role.id);
                break;
            }
        }
    }

    return mentioned;
}
