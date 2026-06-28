import { filterProfilesByTeamAndKeyword } from './selectors-profile-filter.js';
import { resolveManagedProfileId } from './selectors-managed-profile-id.js';

export function createProfileSelectors(deps) {
    const {
        getBootstrapData,
        getDom,
        getActiveSession,
        getProfileFilterKeyword,
        getSelectedProfileId,
        getManagedTeamId,
        getProfileById
    } = deps;

    function getFilteredProfiles() {
        return filterProfilesByTeamAndKeyword({
            profiles: getBootstrapData()?.profiles || [],
            managedTeamId: getManagedTeamId(),
            profileFilterKeyword: getProfileFilterKeyword()
        });
    }

    function getManagedProfileId() {
        const dom = getDom();
        const activeSession = getActiveSession();
        return resolveManagedProfileId({
            managedTeamId: getManagedTeamId(),
            selectedProfileId: getSelectedProfileId(),
            domProfileId: dom?.profileSelect?.value,
            activeSessionProfileId: activeSession?.profile_id,
            bootstrapData: getBootstrapData(),
            getProfileById
        });
    }

    function getProfilesForManagerView(preferredProfileId = null) {
        const filteredProfiles = getFilteredProfiles();
        const targetProfile = getProfileById(preferredProfileId || getManagedProfileId());
        const profilesToRender = [...filteredProfiles];
        const managedTeamId = getManagedTeamId();

        if (
            targetProfile &&
            !profilesToRender.some(profile => profile.id === targetProfile.id) &&
            (!managedTeamId || String(targetProfile.team_id || '') === managedTeamId)
        ) {
            profilesToRender.unshift(targetProfile);
        }

        return profilesToRender;
    }

    function getManagedProfile() {
        const profileId = getManagedProfileId();
        return (getBootstrapData()?.profiles || []).find(profile => profile.id === profileId) || null;
    }

    return {
        getProfilesForManagerView,
        getFilteredProfiles,
        getManagedProfileId,
        getManagedProfile
    };
}
