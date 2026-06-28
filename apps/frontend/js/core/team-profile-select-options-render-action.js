import { buildTeamProfileSelectRenderContext } from './team-profile-select-options-render-context.js';
import { renderTeamProfileSelectResult } from './team-profile-select-options-render-result.js';

export function createRenderProfileSelectOptions(deps) {
    const {
        getBootstrapData,
        getTeams,
        getDom,
        getSelectedProfileId,
        setSelectedProfileId,
        getActiveSession,
        getProfileById,
        getFilteredProfiles,
        getManagedTeamId,
        formatProfileOptionLabel,
        setSelectedTeamId,
        resolveManagedTeamId,
        renderProfileSearchMeta
    } = deps;

    return function renderProfileSelectOptions(preferredProfileId = null) {
        const context = buildTeamProfileSelectRenderContext({
            preferredProfileId,
            getBootstrapData,
            getTeams,
            getDom,
            getSelectedProfileId,
            getActiveSession,
            getFilteredProfiles,
            getManagedTeamId
        });
        renderTeamProfileSelectResult(context, {
            setSelectedProfileId,
            formatProfileOptionLabel,
            getProfileById,
            setSelectedTeamId,
            resolveManagedTeamId,
            renderProfileSearchMeta
        });
    };
}
