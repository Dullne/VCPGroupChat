import { createSessionRoleSelectors } from './selectors-session-roles.js';
import { createManagedProfileMemberSelectors } from './selectors-managed-profile-members.js';
import { createManagedTeamMemberSelectors } from './selectors-managed-team-members.js';
import { createTeamProfileSelectors } from './selectors-team-profile.js';

export function createSelectors(deps) {
    const teamProfileSelectors = createTeamProfileSelectors(deps);
    const managedProfileMemberSelectors = createManagedProfileMemberSelectors({
        getManagedProfile: teamProfileSelectors.getManagedProfile,
        getBootstrapData: deps.getBootstrapData
    });
    const managedTeamMemberSelectors = createManagedTeamMemberSelectors({
        getManagedTeamId: teamProfileSelectors.getManagedTeamId,
        getBootstrapData: deps.getBootstrapData
    });
    const sessionRoleSelectors = createSessionRoleSelectors({
        getActiveSession: deps.getActiveSession,
        getBootstrapData: deps.getBootstrapData,
        getAvailableRoles: deps.getAvailableRoles,
        getManagedProfile: teamProfileSelectors.getManagedProfile
    });

    return {
        ...teamProfileSelectors,
        ...managedProfileMemberSelectors,
        ...managedTeamMemberSelectors,
        ...sessionRoleSelectors
    };
}
