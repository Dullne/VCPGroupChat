import { createSelectors } from './selectors.js';

export function createSelectorsRuntime(deps) {
    const {
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
    } = deps;

    const selectorsManager = createSelectors({
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
        getTeamById: (...args) => selectorsManager.getTeamById(...args),
        getManagedTeamId: (...args) => selectorsManager.getManagedTeamId(...args),
        getManagedTeam: (...args) => selectorsManager.getManagedTeam(...args),
        getFilteredTeams: (...args) => selectorsManager.getFilteredTeams(...args),
        getProfileById: (...args) => selectorsManager.getProfileById(...args),
        getProfilesForManagerView: (...args) => selectorsManager.getProfilesForManagerView(...args),
        getFilteredProfiles: (...args) => selectorsManager.getFilteredProfiles(...args),
        getManagedProfileId: (...args) => selectorsManager.getManagedProfileId(...args),
        getManagedProfile: (...args) => selectorsManager.getManagedProfile(...args),
        getManagedTeamMembers: (...args) => selectorsManager.getManagedTeamMembers(...args),
        getManagedTeamMemberIds: (...args) => selectorsManager.getManagedTeamMemberIds(...args),
        isRoleInManagedTeam: (...args) => selectorsManager.isRoleInManagedTeam(...args),
        getManagedProfileMemberIds: (...args) => selectorsManager.getManagedProfileMemberIds(...args),
        getManagedProfileMember: (...args) => selectorsManager.getManagedProfileMember(...args),
        getManagedProfileMemberPosition: (...args) => selectorsManager.getManagedProfileMemberPosition(...args),
        getManagedProfileEnabledMemberCount: (...args) => selectorsManager.getManagedProfileEnabledMemberCount(...args),
        isRoleInManagedProfile: (...args) => selectorsManager.isRoleInManagedProfile(...args),
        getSessionProfile: (...args) => selectorsManager.getSessionProfile(...args),
        isRoleInSessionProfile: (...args) => selectorsManager.isRoleInSessionProfile(...args),
        getSelectableRoles: (...args) => selectorsManager.getSelectableRoles(...args),
        getAutomaticParticipantRoles: (...args) => selectorsManager.getAutomaticParticipantRoles(...args),
        getSortedRolesForPanel: (...args) => selectorsManager.getSortedRolesForPanel(...args)
    };
}
