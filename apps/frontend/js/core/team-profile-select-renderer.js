import { renderTeamProfileSearchMeta } from './team-profile-search-meta.js';
import { createRenderProfileSelectOptionsAction } from './team-profile-select-options-renderer.js';

export function createTeamProfileSelectRenderer(deps) {
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
        getManagedTeam,
        getProfileFilterKeyword,
        formatProfileOptionLabel,
        setSelectedTeamId,
        resolveManagedTeamId
    } = deps;

    function renderProfileSearchMeta(filteredCount, totalCount) {
        renderTeamProfileSearchMeta({
            getDom,
            getManagedTeam,
            getProfileFilterKeyword,
            filteredCount,
            totalCount
        });
    }
    const renderProfileSelectOptions = createRenderProfileSelectOptionsAction({
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
    });

    return {
        renderProfileSelectOptions,
        renderProfileSearchMeta
    };
}
