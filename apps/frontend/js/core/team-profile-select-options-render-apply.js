import { resolveNextProfileValue } from './team-profile-select-render-state.js';
import { applyTeamProfileSelection } from './team-profile-select-apply-selection.js';

export function applyRenderedTeamProfileSelection(deps) {
    const {
        dom,
        profilesToRender,
        targetProfileId,
        setSelectedProfileId,
        getProfileById,
        setSelectedTeamId,
        resolveManagedTeamId
    } = deps;

    const nextValue = resolveNextProfileValue({
        profilesToRender,
        targetProfileId
    });

    applyTeamProfileSelection({
        dom,
        nextValue,
        setSelectedProfileId,
        getProfileById,
        setSelectedTeamId,
        resolveManagedTeamId
    });
}
