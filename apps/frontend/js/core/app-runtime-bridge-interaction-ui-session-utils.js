export function createRuntimeInteractionUiSessionUtilityBridges(deps) {
    const {
        runtime,
        getTeams,
        resolveManagedTeamIdByTeams,
        normalizeTeamsFromBootstrapModule,
        getDeterministicRandomIntModule,
        pickRandomSubsetDeterministicModule,
        getRoundRoleDebugBadgeClassModule,
        getImportedRoleIdFromCatalogItemModule
    } = deps;

    const getDeterministicRandomInt = (min, max, seedText) => getDeterministicRandomIntModule(min, max, seedText);
    const pickRandomSubsetDeterministic = (items, targetCount, seedText) =>
        pickRandomSubsetDeterministicModule(items, targetCount, seedText);
    const getRoundRoleDebugBadgeClass = getRoundRoleDebugBadgeClassModule;
    const updateRoleRuntimeModel = (role, model) => runtime.roleRuntimeActions.updateRoleRuntimeModel(role, model);
    const getImportedRoleIdFromCatalogItem = getImportedRoleIdFromCatalogItemModule;
    const getCatalogItem = (sourceId, sourceItemId) => runtime.roleLibraryRuntime.getCatalogItem(sourceId, sourceItemId);
    const normalizeTeamsFromBootstrap = data => normalizeTeamsFromBootstrapModule(data);
    const resolveManagedTeamId = (preferredTeamId = null) => resolveManagedTeamIdByTeams(getTeams(), preferredTeamId);

    return {
        getDeterministicRandomInt,
        pickRandomSubsetDeterministic,
        getRoundRoleDebugBadgeClass,
        updateRoleRuntimeModel,
        getImportedRoleIdFromCatalogItem,
        getCatalogItem,
        normalizeTeamsFromBootstrap,
        resolveManagedTeamId
    };
}
