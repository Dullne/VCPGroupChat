import { bindProfileFormEvents } from './ui-event-bindings-profile-forms.js';
import { bindTeamAndSessionEvents } from './ui-event-bindings-team-session.js';

export function bindProfileTeamEvents(deps) {
    bindProfileFormEvents({
        dom: deps.dom,
        createGroupProfileFromForm: deps.createGroupProfileFromForm,
        renderGroupProfileModeOptions: deps.renderGroupProfileModeOptions,
        setProfileFilterKeyword: deps.setProfileFilterKeyword,
        renderProfileSelectOptions: deps.renderProfileSelectOptions,
        renderRoleManager: deps.renderRoleManager,
        loadManagedProfileIntoForm: deps.loadManagedProfileIntoForm,
        duplicateManagedProfile: deps.duplicateManagedProfile,
        startSessionWithManagedProfile: deps.startSessionWithManagedProfile,
        saveManagedProfileFromForm: deps.saveManagedProfileFromForm,
        deleteManagedProfile: deps.deleteManagedProfile
    });

    bindTeamAndSessionEvents({
        dom: deps.dom,
        createTeamFromForm: deps.createTeamFromForm,
        startTeamDraft: deps.startTeamDraft,
        copyDefaultTeamMembersToDraft: deps.copyDefaultTeamMembersToDraft,
        setTeamFilterKeyword: deps.setTeamFilterKeyword,
        renderRoleManager: deps.renderRoleManager,
        updateManagedTeamFromForm: deps.updateManagedTeamFromForm,
        deleteManagedTeam: deps.deleteManagedTeam,
        setSelectedProfileId: deps.setSelectedProfileId,
        getProfileById: deps.getProfileById,
        resolveManagedTeamId: deps.resolveManagedTeamId,
        setSelectedTeamId: deps.setSelectedTeamId,
        switchSession: deps.switchSession,
        setLauncherRoleFilterKeyword: deps.setLauncherRoleFilterKeyword,
        setLauncherRoleTagFilter: deps.setLauncherRoleTagFilter,
        clearLauncherSelectedPersonIds: deps.clearLauncherSelectedPersonIds
    });
}
