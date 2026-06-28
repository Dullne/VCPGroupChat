import { resolveManagedTeamIdByTeams } from './model-preferences.js';
import { createSelectorsRuntime } from './selectors-runtime-factory.js';

export function createSelectorsRuntimeForApp(stateAccessors) {
    const {
        getConfig,
        getDom,
        getBootstrapData,
        getTeams,
        getActiveSession,
        getAvailableRoles,
        getTeamFilterKeyword,
        getProfileFilterKeyword,
        getSelectedTeamId,
        setSelectedTeamId,
        getSelectedProfileId
    } = stateAccessors;

    const resolveManagedTeamId = (preferredTeamId = null) => resolveManagedTeamIdByTeams(getTeams(), preferredTeamId);

    const selectorsRuntime = createSelectorsRuntime({
        getTeams,
        getBootstrapData,
        getDom,
        getActiveSession,
        getAvailableRoles,
        getTeamFilterKeyword,
        getProfileFilterKeyword,
        getSelectedTeamId,
        setSelectedTeamId,
        getSelectedProfileId,
        resolveManagedTeamId
    });

    return {
        selectorsRuntime,
        getTeams,
        getConfig,
        getDom
    };
}
