import { buildStateAccessorsBySpec } from './app-state-accessors-map-builder.js';

export function createCoreStateValueAccessors(deps) {
    const {
        state,
        getStateValue,
        setStateValue
    } = deps;

    const baseAccessors = buildStateAccessorsBySpec({
        getStateValue,
        setStateValue,
        specs: [
            { key: 'config', name: 'config', set: true },
            { key: 'dom', name: 'dom' },
            { key: 'bootstrapData', name: 'bootstrapData', set: true },
            { key: 'teams', name: 'teams', set: true },
            { key: 'sessions', name: 'sessions', set: true },
            { key: 'activeSession', name: 'activeSession', set: true },
            { key: 'availableRoles', name: 'availableRoles', set: true },
            { key: 'persons', name: 'persons', set: true },
            { key: 'roleTemplates', name: 'roleTemplates', set: true },
            { key: 'externalImportSources', name: 'externalImportSources', set: true },
            { key: 'selectedTeamId', name: 'selectedTeamId', set: true },
            { key: 'selectedProfileId', name: 'selectedProfileId', set: true },
            { key: 'teamFilterKeyword', name: 'teamFilterKeyword', set: true },
            { key: 'profileFilterKeyword', name: 'profileFilterKeyword', set: true },
            { key: 'selectedImageBase64', name: 'selectedImageBase64', set: true },
            { key: 'locale', name: 'locale', set: true },
            { key: 'selectedIncludeRoleIds', name: 'selectedIncludeRoleIds', set: true },
            { key: 'persistentlyMutedRoleNames', name: 'persistentlyMutedRoleNames' },
            { key: 'excludedRoleNamesForNextRound', name: 'excludedRoleNamesForNextRound' }
        ]
    });

    const clearSelectedIncludeRoleIds = () => {
        state.selectedIncludeRoleIds.clear();
    };
    const clearExcludedRoleNamesForNextRound = () => {
        state.excludedRoleNamesForNextRound.clear();
    };

    return {
        ...baseAccessors,
        clearSelectedIncludeRoleIds,
        clearExcludedRoleNamesForNextRound
    };
}
