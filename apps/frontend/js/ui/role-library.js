// ========== 角色库渲染 ==========
import { state } from '../core/state.js';
import { fetchJson } from '../utils/http.js';
import {
    loadLegacyRoleLibraryImportSources,
    renderLegacyRoleLibraryImportSourceList
} from './role-library-import-sources-legacy.js';
import {
    loadLegacyRoleLibrarySessionRoles,
    renderLegacyRoleLibrarySessionRoleList
} from './role-library-session-roles-legacy.js';
import { buildLegacyRoleImportHandler } from './role-library-import-role-handler.js';

export async function loadRoleLibrary() {
    await loadImportSources();
    await loadSessionRoles();
}

async function loadImportSources() {
    await loadLegacyRoleLibraryImportSources({
        state,
        fetchJson,
        renderImportSourceList
    });
}

async function loadSessionRoles() {
    await loadLegacyRoleLibrarySessionRoles({
        state,
        fetchJson,
        renderSessionRoleList
    });
}

function renderImportSourceList() {
    renderLegacyRoleLibraryImportSourceList(state);
}

function renderSessionRoleList() {
    renderLegacyRoleLibrarySessionRoleList(state);
}

// 全局导入函数
window.importRole = buildLegacyRoleImportHandler({
    fetchJson,
    loadSessionRoles
});
