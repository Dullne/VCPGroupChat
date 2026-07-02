import { resetGroupProfileCreateForm } from './workspace-profile-create-form-reset.js';
import { handleGroupProfileCreated } from './workspace-profile-create-form-post-create.js';
import { readGroupProfileCreateFormValues } from './workspace-profile-create-form-values.js';
import { resolveGroupProfileCreateContext } from './workspace-profile-create-form-validate.js';
import { requestCreateGroupProfileFromForm } from './workspace-profile-create-form-request.js';
import { getWorkspaceTeamMemberPoolCoreRoles } from '../ui/workspace-renderers-team-member-pool-core-roles.js';

export function createGroupProfileFromFormAction(deps) {
    const {
        getDom,
        fetchJson,
        showToast,
        getManagedTeam,
        getManagedProfile,
        setGroupProfileFormLoadedProfileId,
        readGroupProfileModeOptionsFromForm,
        applyGroupProfileModeOptionsToForm,
        renderGroupProfileModeOptions,
        refreshBootstrap,
        setManagedProfile,
        createSession,
        toggleRoleManager,
        renderAll,
        getWorkspaceMode,
        getLauncherSelectedPersonIds,
        clearLauncherSelectedPersonIds,
        getBootstrapData
    } = deps;

    function getLauncherPersonCandidates() {
        return getWorkspaceTeamMemberPoolCoreRoles(getBootstrapData());
    }

    async function prepareLauncherMembers() {
        if (getWorkspaceMode?.() !== 'launcher') {
            return [];
        }

        const selectedPersonIds = [...(getLauncherSelectedPersonIds?.() || [])].filter(Boolean);
        if (!selectedPersonIds.length) {
            showToast('请先从人物通讯录选择至少 1 个群聊成员', 'warning');
            return null;
        }

        const candidates = getLauncherPersonCandidates();
        const selectedCandidates = selectedPersonIds
            .map(personId => candidates.find(candidate => candidate?.person_identity?.id === personId))
            .filter(Boolean);
        const hasUnavailableSelection = selectedCandidates.length !== selectedPersonIds.length
            || selectedCandidates.some(candidate => candidate.runtime_binding_status !== 'ready');
        if (hasUnavailableSelection) {
            showToast('已选人物中有未绑定或缺失运行时角色，请先绑定运行时能力后再开聊', 'warning');
            return null;
        }

        return selectedCandidates.map((candidate, index) => {
            return {
                person_id: candidate.person_identity.id,
                group_alias: candidate.person_identity.display_name || '',
                member_order: (index + 1) * 10
            };
        });
    }

    return async function createGroupProfileFromForm() {
        const dom = getDom();
        const formData = new FormData(dom.groupProfileForm);
        const values = readGroupProfileCreateFormValues({
            formData,
            readGroupProfileModeOptionsFromForm
        });
        const createContext = resolveGroupProfileCreateContext({
            name: values.name,
            getManagedTeam,
            getManagedProfile,
            showToast
        });
        if (!createContext) {
            return;
        }
        const { managedTeam, currentProfile } = createContext;
        const launcherMembers = await prepareLauncherMembers();
        if (launcherMembers === null) {
            return;
        }
        if (launcherMembers.length > 0) {
            values.cloneCurrentProfile = false;
            values.personMembers = launcherMembers;
            values.members = [];
            values.startSession = true;
        }

        const created = await requestCreateGroupProfileFromForm({
            fetchJson,
            values,
            managedTeamId: managedTeam.id,
            currentProfileId: currentProfile?.id
        });

        resetGroupProfileCreateForm({
            dom,
            setGroupProfileFormLoadedProfileId,
            applyGroupProfileModeOptionsToForm,
            renderGroupProfileModeOptions
        });
        if (launcherMembers.length > 0) {
            clearLauncherSelectedPersonIds?.();
        }

        const shouldCloseLauncher = launcherMembers.length > 0 && values.startSession;
        await handleGroupProfileCreated({
            createdProfile: created.profile,
            startSession: values.startSession,
            refreshBootstrap,
            setManagedProfile,
            createSession,
            renderAll,
            toggleRoleManager: shouldCloseLauncher ? toggleRoleManager : null,
            showToast
        });
    };
}
