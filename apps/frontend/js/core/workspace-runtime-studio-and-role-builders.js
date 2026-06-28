import { createEphemeralRoleActions } from './ephemeral-role-actions.js';
import { createRoleRuntimeActions } from './role-runtime-actions.js';
import { createRoleStudioSaveAction } from './role-studio-save-action.js';
import { createRoleStudioRenderer } from '../ui/role-studio-renderer.js';

export function buildWorkspaceEphemeralRoleActions(deps) {
    return createEphemeralRoleActions({
        getDom: deps.getDom,
        getActiveSession: deps.getActiveSession,
        getLatestRoleDraft: deps.getLatestRoleDraft,
        setLatestRoleDraft: deps.setLatestRoleDraft,
        setLatestRoleDraftMeta: deps.setLatestRoleDraftMeta,
        setAdvancedRoleEditorExpanded: deps.setAdvancedRoleEditorExpanded,
        fetchJson: deps.fetchJson,
        showToast: deps.showToast,
        reloadActiveSessionAndRoles: deps.reloadActiveSessionAndRoles,
        refreshBootstrap: deps.refreshBootstrap,
        renderAll: deps.renderAll,
        defaultSharedNotebook: deps.defaultSharedNotebook
    });
}

export function buildWorkspaceRoleStudioRenderer(deps) {
    return createRoleStudioRenderer({
        getDom: deps.getDom,
        getLatestRoleDraft: deps.getLatestRoleDraft,
        getLatestRoleDraftMeta: deps.getLatestRoleDraftMeta,
        getAdvancedRoleEditorExpanded: deps.getAdvancedRoleEditorExpanded,
        hasMeaningfulRoleDraft: deps.hasMeaningfulRoleDraft,
        renderRoleStudioModelOptions: deps.renderRoleStudioModelOptions,
        renderRuntimeModelOptions: deps.renderRuntimeModelOptions,
        renderRoleStudioSources: deps.renderRoleStudioSources,
        buildRoleDraftMetaLabels: deps.buildRoleDraftMetaLabels,
        summarizeInline: deps.summarizeInline
    });
}

export function buildWorkspaceRoleStudioActions(deps) {
    return {
        saveRoleDraft: createRoleStudioSaveAction({
            getDom: deps.getDom,
            getLatestRoleDraft: deps.getLatestRoleDraft,
            getManagedTeamId: deps.getManagedTeamId,
            getManagedProfileId: deps.getManagedProfileId,
            fetchJson: deps.fetchJson,
            showToast: deps.showToast,
            refreshBootstrap: deps.refreshBootstrap,
            reloadActiveSessionAndRoles: deps.reloadActiveSessionAndRoles,
            renderAll: deps.renderAll,
            defaultSharedNotebook: deps.defaultSharedNotebook
        })
    };
}

export function buildWorkspaceRoleRuntimeActions(deps) {
    return createRoleRuntimeActions({
        getActiveSession: deps.getActiveSession,
        getManagedProfileId: deps.getManagedProfileId,
        fetchJson: deps.fetchJson,
        reloadActiveSessionAndRoles: deps.reloadActiveSessionAndRoles,
        refreshBootstrap: deps.refreshBootstrap,
        renderAll: deps.renderAll
    });
}
