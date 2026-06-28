// ========== 模态框管理 ==========
import { state } from '../core/state.js';
import { fetchJson } from '../utils/http.js';
import { showToast, showLoading, hideLoading } from '../utils/ui-helpers.js';
import { createModalTeamRenderer } from './modal-team-renderer.js';
import { createModalTeamActions } from './modal-team-actions.js';
import { applyModalViewToggle, applyModalClose } from './modal-view-toggle.js';

const {
    renderTeamManager: renderTeamManagerView,
    renderRoleStudio: renderRoleStudioView,
    renderRoleLibrary: renderRoleLibraryView
} = createModalTeamRenderer({
    state,
    getDocument: () => document
});

const {
    createTeam: createTeamAction,
    deleteTeam: deleteTeamAction
} = createModalTeamActions({
    state,
    fetchJson,
    showToast,
    showLoading,
    hideLoading,
    renderTeamManager: renderTeamManagerView,
    confirmDelete: message => confirm(message)
});

export function openModal(mode) {
    state.workspaceMode = mode;
    applyModalViewToggle({ mode });

    if (mode === 'team') {
        renderTeamManagerView();
    }
    if (mode === 'studio') {
        renderRoleStudioView();
    }
    if (mode === 'library') {
        renderRoleLibraryView();
    }
}

export function closeModal() {
    applyModalClose();
}

export async function createTeam(data) {
    return createTeamAction(data);
}

export async function deleteTeam(teamId) {
    return deleteTeamAction(teamId);
}
