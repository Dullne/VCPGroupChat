import { createSessionProfileSelectors } from './selectors-session-profile.js';
import { createSessionRoleListSelectors } from './selectors-session-role-list.js';

export function createSessionRoleSelectors(deps) {
    const {
        getSessionProfileId,
        getSessionProfile,
        getSessionProfileMemberIds,
        isRoleInSessionProfile
    } = createSessionProfileSelectors(deps);
    const {
        getSortedRolesForPanel,
        getSelectableRoles,
        getAutomaticParticipantRoles
    } = createSessionRoleListSelectors({
        getAvailableRoles: deps.getAvailableRoles,
        getManagedProfile: deps.getManagedProfile,
        getSessionProfile,
        getSessionProfileMemberIds
    });

    return {
        getSessionProfileId,
        getSessionProfile,
        getSessionProfileMemberIds,
        isRoleInSessionProfile,
        getSortedRolesForPanel,
        getSelectableRoles,
        getAutomaticParticipantRoles
    };
}
