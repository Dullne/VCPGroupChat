import { resolveManagedTeamIdState } from './selectors-managed-team-id.js';
import { filterTeamsByKeyword } from './selectors-team-filter.js';

export function createTeamSelectors(deps) {
    const {
        getTeams,
        getBootstrapData,
        getDom,
        getActiveSession,
        getTeamFilterKeyword,
        getSelectedTeamId,
        setSelectedTeamId,
        getSelectedProfileId,
        resolveManagedTeamId,
        getProfileById
    } = deps;

    function getTeamById(teamId) {
        return getTeams().find(team => team.id === teamId) || null;
    }

    function getManagedTeamId() {
        const teams = getTeams();
        if (!teams.length) {
            setSelectedTeamId(null);
            return null;
        }

        const dom = getDom();
        const bootstrapData = getBootstrapData();
        const activeSession = getActiveSession();
        return resolveManagedTeamIdState({
            teams,
            selectedTeamId: getSelectedTeamId(),
            domProfileId: dom?.profileSelect?.value,
            selectedProfileId: getSelectedProfileId(),
            activeSessionProfileId: activeSession?.profile_id,
            getProfileById,
            resolveManagedTeamId,
            defaultTeamId: bootstrapData?.default_team_id,
            setSelectedTeamId
        });
    }

    function getManagedTeam() {
        return getTeamById(getManagedTeamId());
    }

    function getFilteredTeams() {
        return filterTeamsByKeyword(getTeams(), getTeamFilterKeyword());
    }

    return {
        getTeamById,
        getManagedTeamId,
        getManagedTeam,
        getFilteredTeams
    };
}
