import { createTeamProfileSelectRenderer } from './team-profile-select-renderer.js';
import { applyManagedProfileSelection } from './team-profile-selection-profile-action.js';
import { applyManagedTeamSelection } from './team-profile-selection-team-action.js';

export function createTeamProfileSelectionHelpers(deps) {
    const {
        getDom,
        getSelectedProfileId,
        setSelectedProfileId,
        setSelectedTeamId,
        resolveManagedTeamId,
        getProfileById,
        getBootstrapData,
        getTeams,
        getActiveSession,
        getFilteredProfiles,
        getManagedTeamId,
        getManagedTeam,
        getProfileFilterKeyword,
        formatProfileOptionLabel
    } = deps;

    const {
        renderProfileSelectOptions,
        renderProfileSearchMeta
    } = createTeamProfileSelectRenderer(deps);

    function setManagedProfile(profileId) {
        applyManagedProfileSelection({
            ...deps,
            profileId,
        });
    }

    function setManagedTeam(teamId, { alignProfile = true } = {}) {
        applyManagedTeamSelection({
            ...deps,
            teamId,
            alignProfile,
            renderProfileSelectOptions,
        });
    }

    return {
        setManagedProfile,
        setManagedTeam,
        renderProfileSelectOptions,
        renderProfileSearchMeta
    };
}
