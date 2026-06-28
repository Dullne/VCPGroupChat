import { createTeamProfileSelectionHelpers } from './team-profile-selection.js';
import { createTeamProfileFormStateHelpers } from './team-profile-form-state.js';

export function createTeamProfileManager(deps) {
    return {
        ...createTeamProfileSelectionHelpers(deps),
        ...createTeamProfileFormStateHelpers(deps)
    };
}
