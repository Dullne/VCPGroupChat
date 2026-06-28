import { resetGroupProfileCreateForm } from './workspace-profile-create-form-reset.js';
import { handleGroupProfileCreated } from './workspace-profile-create-form-post-create.js';
import { readGroupProfileCreateFormValues } from './workspace-profile-create-form-values.js';
import { resolveGroupProfileCreateContext } from './workspace-profile-create-form-validate.js';
import { requestCreateGroupProfileFromForm } from './workspace-profile-create-form-request.js';

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
        getLauncherSelectedRoleIds,
        clearLauncherSelectedRoleIds,
        getBootstrapData,
        isRoleInManagedTeam
    } = deps;

    function getRoleName(roleId) {
        const role = (getBootstrapData()?.roles || []).find(item => item.id === roleId);
        return role?.name || roleId;
    }

    async function prepareLauncherMembers(managedTeam) {
        if (getWorkspaceMode?.() !== 'launcher') {
            return [];
        }

        const selectedRoleIds = [...(getLauncherSelectedRoleIds?.() || [])].filter(Boolean);
        if (!selectedRoleIds.length) {
            showToast('请先从角色库选择至少 1 个群聊成员', 'warning');
            return null;
        }

        for (const [index, roleId] of selectedRoleIds.entries()) {
            if (isRoleInManagedTeam?.(roleId)) {
                continue;
            }
            await fetchJson(`/api/teams/${encodeURIComponent(managedTeam.id)}/members`, {
                method: 'POST',
                body: {
                    role_id: roleId,
                    role_name: getRoleName(roleId),
                    role_order: (index + 1) * 10
                }
            });
        }

        return selectedRoleIds.map((roleId, index) => ({
            role_id: roleId,
            role_name: getRoleName(roleId),
            role_order: (index + 1) * 10
        }));
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
        const launcherMembers = await prepareLauncherMembers(managedTeam);
        if (launcherMembers === null) {
            return;
        }
        if (launcherMembers.length > 0) {
            values.cloneCurrentProfile = false;
            values.members = launcherMembers;
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
            clearLauncherSelectedRoleIds?.();
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
