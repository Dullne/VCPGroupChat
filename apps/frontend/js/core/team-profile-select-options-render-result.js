import {
    renderEmptyProfileSelect,
    renderGroupedProfileOptions
} from './team-profile-select-render-dom.js';
import { applyRenderedTeamProfileSelection } from './team-profile-select-options-render-apply.js';

export function renderTeamProfileSelectResult(context, deps) {
    const {
        dom,
        teams,
        allProfiles,
        filteredProfiles,
        targetProfileId,
        selectedProfile,
        profilesToRender
    } = context;
    const {
        setSelectedProfileId,
        formatProfileOptionLabel,
        getProfileById,
        setSelectedTeamId,
        resolveManagedTeamId,
        renderProfileSearchMeta
    } = deps;

    if (!profilesToRender.length) {
        renderEmptyProfileSelect(dom, selectedProfile, setSelectedProfileId);
        renderProfileSearchMeta(0, allProfiles.length);
        return;
    }

    renderGroupedProfileOptions({
        dom,
        profilesToRender,
        teams,
        formatProfileOptionLabel
    });

    applyRenderedTeamProfileSelection({
        dom,
        profilesToRender,
        targetProfileId,
        setSelectedProfileId,
        getProfileById,
        setSelectedTeamId,
        resolveManagedTeamId
    });
    renderProfileSearchMeta(filteredProfiles.length, allProfiles.length);
}
