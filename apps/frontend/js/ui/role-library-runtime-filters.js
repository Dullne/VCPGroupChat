export function parseRoleLibraryTags(entity) {
    const rawTags = Array.isArray(entity?.tags)
        ? entity.tags
        : String(entity?.tag || entity?.role_spec?.tag || '')
            .split(/[，,]/);
    return rawTags
        .map(item => String(item || '').trim())
        .filter(Boolean);
}

export function resolveRoleLibrarySource(entity) {
    return String(entity?.source || entity?.source_name || '').trim().toLowerCase();
}

export function readRoleLibraryFilters(dom) {
    return {
        keyword: String(dom.roleLibrarySearch?.value || '').trim().toLowerCase(),
        source: String(dom.roleLibrarySourceFilter?.value || '').trim().toLowerCase(),
        status: String(dom.roleLibraryStatusFilter?.value || '').trim().toLowerCase()
    };
}

export function buildRoleLibrarySearchText(entity, sourceName = '') {
    return [
        entity?.name,
        entity?.id,
        entity?.source_item_id,
        entity?.description,
        entity?.preview,
        entity?.persona,
        entity?.voice_style,
        entity?.model,
        entity?.role_spec?.persona,
        entity?.role_spec?.description,
        parseRoleLibraryTags(entity).join(' '),
        entity?.source,
        entity?.source_name,
        sourceName
    ].filter(Boolean).join(' ').toLowerCase();
}

export function matchesRoleLibraryKeyword(entity, filters, sourceName = '') {
    if (!filters.keyword) {
        return true;
    }
    return buildRoleLibrarySearchText(entity, sourceName).includes(filters.keyword);
}

export function matchesRoleLibraryImportSource(item, filters, deps) {
    const {
        source,
        getImportedRoleIdFromCatalogItem,
        isRoleInManagedProfile,
        isRoleInManagedTeam
    } = deps;
    const itemSource = resolveRoleLibrarySource(item) || String(source?.id || '').toLowerCase();
    const importedRoleId = getImportedRoleIdFromCatalogItem(item);
    const imported = Boolean(item.imported || importedRoleId);

    if (filters.source && filters.source !== itemSource) {
        return false;
    }
    if (!matchesRoleLibraryKeyword(item, filters, source?.name || source?.id || '')) {
        return false;
    }
    if (filters.status === 'imported' && !imported) {
        return false;
    }
    if (filters.status === 'not-imported' && imported) {
        return false;
    }
    if (filters.status === 'group' && (!importedRoleId || !isRoleInManagedProfile(importedRoleId))) {
        return false;
    }
    if (filters.status === 'team' && (!importedRoleId || !isRoleInManagedTeam(importedRoleId))) {
        return false;
    }
    return true;
}

export function matchesRoleLibrarySessionRole(role, filters, deps) {
    const {
        isRoleInManagedProfile,
        isRoleInManagedTeam
    } = deps;
    const source = resolveRoleLibrarySource(role);
    const isEphemeral = role.source === 'ephemeral';

    if (filters.source === 'core' && isEphemeral) {
        return false;
    }
    if (filters.source === 'ephemeral' && !isEphemeral) {
        return false;
    }
    if (!['', 'core', 'ephemeral'].includes(filters.source) && source !== filters.source) {
        return false;
    }
    if (!matchesRoleLibraryKeyword(role, filters)) {
        return false;
    }
    if (filters.status === 'group' && !isRoleInManagedProfile(role.id)) {
        return false;
    }
    if (filters.status === 'team' && !isRoleInManagedTeam(role.id)) {
        return false;
    }
    if (filters.status === 'not-imported') {
        return false;
    }
    return true;
}

export function summarizeRoleLibraryState({ roles, externalImportSources, isRoleInManagedProfile, isRoleInManagedTeam }) {
    const coreRoles = roles.filter(role => role.source !== 'ephemeral').length;
    const ephemeralRoles = roles.filter(role => role.source === 'ephemeral').length;
    const groupMembers = roles.filter(role => isRoleInManagedProfile(role.id)).length;
    const teamMembers = roles.filter(role => isRoleInManagedTeam(role.id)).length;
    const catalogItems = externalImportSources.reduce((sum, source) => sum + (source.items?.length || 0), 0);
    const importedCatalogItems = externalImportSources
        .flatMap(source => source.items || [])
        .filter(item => item.imported || item.imported_role_id).length;

    return {
        coreRoles,
        ephemeralRoles,
        groupMembers,
        teamMembers,
        catalogItems,
        importedCatalogItems
    };
}
