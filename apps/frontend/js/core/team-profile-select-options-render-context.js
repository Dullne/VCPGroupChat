import { resolveTargetProfileId } from './team-profile-select-options.js';
import { buildProfilesToRender } from './team-profile-select-render-state.js';

export function buildTeamProfileSelectRenderContext(deps) {
    const {
        preferredProfileId,
        getBootstrapData,
        getTeams,
        getDom,
        getSelectedProfileId,
        getActiveSession,
        getFilteredProfiles,
        getManagedTeamId
    } = deps;

    const bootstrapData = getBootstrapData();
    const teams = getTeams();
    const dom = getDom();
    const allProfiles = bootstrapData?.profiles || [];
    const targetProfileId = resolveTargetProfileId({
        preferredProfileId,
        getSelectedProfileId,
        getActiveSession,
        bootstrapData
    });

    const filteredProfiles = getFilteredProfiles();
    const selectedProfile = allProfiles.find(profile => profile.id === targetProfileId) || null;
    const profilesToRender = buildProfilesToRender({
        filteredProfiles,
        selectedProfile,
        managedTeamId: getManagedTeamId()
    });

    return {
        dom,
        teams,
        allProfiles,
        filteredProfiles,
        targetProfileId,
        selectedProfile,
        profilesToRender
    };
}
