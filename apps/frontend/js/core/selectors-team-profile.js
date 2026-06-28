import { createTeamSelectors } from './selectors-team-resolver.js';
import { createProfileSelectors } from './selectors-profile-resolver.js';

export function createTeamProfileSelectors(deps) {
    const getProfileById = profileId =>
        (deps.getBootstrapData()?.profiles || []).find(profile => profile.id === profileId) || null;

    const {
        getTeamById,
        getManagedTeamId,
        getManagedTeam,
        getFilteredTeams
    } = createTeamSelectors({
        getTeams: deps.getTeams,
        getBootstrapData: deps.getBootstrapData,
        getDom: deps.getDom,
        getActiveSession: deps.getActiveSession,
        getTeamFilterKeyword: deps.getTeamFilterKeyword,
        getSelectedTeamId: deps.getSelectedTeamId,
        setSelectedTeamId: deps.setSelectedTeamId,
        getSelectedProfileId: deps.getSelectedProfileId,
        resolveManagedTeamId: deps.resolveManagedTeamId,
        getProfileById
    });

    const {
        getProfilesForManagerView,
        getFilteredProfiles,
        getManagedProfileId,
        getManagedProfile
    } = createProfileSelectors({
        getBootstrapData: deps.getBootstrapData,
        getDom: deps.getDom,
        getActiveSession: deps.getActiveSession,
        getProfileFilterKeyword: deps.getProfileFilterKeyword,
        getSelectedProfileId: deps.getSelectedProfileId,
        getManagedTeamId,
        getProfileById
    });

    return {
        getTeamById,
        getManagedTeamId,
        getManagedTeam,
        getFilteredTeams,
        getProfileById,
        getProfilesForManagerView,
        getFilteredProfiles,
        getManagedProfileId,
        getManagedProfile
    };
}
