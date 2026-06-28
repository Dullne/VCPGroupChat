import {
    normalizeTeamsFromBootstrap as normalizeTeamsFromBootstrapModule,
    normalizeNatureRandomModeOptions as normalizeNatureRandomModeOptionsModule,
    getRoundRoleDebugBadgeClass as getRoundRoleDebugBadgeClassModule,
    getImportedRoleIdFromCatalogItem as getImportedRoleIdFromCatalogItemModule
} from './domain-helpers.js';
import { resolveManagedTeamIdByTeams } from './model-preferences.js';
import {
    readGroupProfileModeOptionsFromForm as readGroupProfileModeOptionsFromFormHelper,
    applyGroupProfileModeOptionsToForm as applyGroupProfileModeOptionsToFormHelper,
    renderGroupProfileModeOptions as renderGroupProfileModeOptionsHelper
} from './group-profile-mode.js';
import {
    buildRoleDraftFromIdea as buildRoleDraftFromIdeaModule,
    normalizeRoleDraft as normalizeRoleDraftModule,
    normalizeRoleDraftMeta as normalizeRoleDraftMetaModule,
    describeRoleDraftGeneration as describeRoleDraftGenerationModule,
    buildRoleDraftMetaLabels as buildRoleDraftMetaLabelsModule,
    hasMeaningfulRoleDraft as hasMeaningfulRoleDraftModule
} from './role-draft.js';
import { fetchJsonWithConfig } from '../api/client.js';
import {
    getDeterministicRandomInt as getDeterministicRandomIntModule,
    pickRandomSubsetDeterministic as pickRandomSubsetDeterministicModule
} from '../utils/random.js';
import { DEFAULT_SHARED_NOTEBOOK } from './constants.js';
import { createAppRuntimeBridges } from './app-runtime-bridges.js';
import { buildRuntimeBridgeDeps } from './app-modular-deps-builders.js';

export function createRuntimeBridgesForApp(deps) {
    const {
        runtime,
        selectorsRuntime,
        getTeams,
        getConfig,
        getDom
    } = deps;

    return createAppRuntimeBridges(buildRuntimeBridgeDeps({
        runtime,
        selectorsRuntime,
        getTeams,
        getConfig,
        getDom,
        fetchJsonWithConfig,
        resolveManagedTeamIdByTeams,
        normalizeTeamsFromBootstrapModule,
        getDeterministicRandomIntModule,
        pickRandomSubsetDeterministicModule,
        getRoundRoleDebugBadgeClassModule,
        getImportedRoleIdFromCatalogItemModule,
        buildRoleDraftFromIdeaModule,
        normalizeRoleDraftModule,
        normalizeRoleDraftMetaModule,
        describeRoleDraftGenerationModule,
        buildRoleDraftMetaLabelsModule,
        hasMeaningfulRoleDraftModule,
        normalizeNatureRandomModeOptionsModule,
        readGroupProfileModeOptionsFromFormHelper,
        applyGroupProfileModeOptionsToFormHelper,
        renderGroupProfileModeOptionsHelper,
        defaultSharedNotebook: DEFAULT_SHARED_NOTEBOOK
    }));
}
