import {
    canEditRoleRuntimeModel,
    buildRoleRuntimeSummary,
    buildRoleRuntimeEditor
} from './role-library-runtime-model-editor.js';
import { buildRoleLibrarySessionRoleDescription } from './role-library-runtime-session-role-description.js';
import { parseRoleLibraryTags } from './role-library-runtime-filters.js';
import { createAsyncActionButton } from './role-card-ui.js';
import { state } from '../core/state.js';
import { loadRoleDetail } from '../core/role-detail-cache.js';
import { fetchJson } from '../utils/http.js';

export function buildRoleLibrarySessionRoleCardContentBlocks(deps) {
    const {
        role,
        getRoleRuntimeModel,
        getRuntimeModelCandidates,
        onApplyRoleRuntimeModel,
        showToast
    } = deps;

    const description = document.createElement('div');
    description.className = 'role-card-description';
    description.textContent = buildRoleLibrarySessionRoleDescription(role);

    const runtimeMeta = document.createElement('div');
    runtimeMeta.className = 'role-card-meta';
    function renderRuntimeMeta(nextRole) {
        const tags = parseRoleLibraryTags(nextRole);
        const runtimeSummary = buildRoleRuntimeSummary(nextRole, getRoleRuntimeModel);
        const metaItems = [
            nextRole.source === 'ephemeral' ? '类型 临时角色' : '类型 核心角色',
            tags.length ? `标签 ${tags.slice(0, 3).join(' / ')}` : '',
            runtimeSummary,
            nextRole.details_loaded ? '详情 已加载' : ''
        ].filter(Boolean);
        runtimeMeta.textContent = metaItems.join(' · ');
    }
    renderRuntimeMeta(role);

    const detailLoader = !role.details_loaded
        ? createAsyncActionButton({
            label: '加载详情',
            variant: 'secondary',
            showToast,
            handler: async () => {
                const detail = await loadRoleDetail({
                    role,
                    sessionId: state.activeSession?.id || '',
                    fetchJson,
                    state
                });
                description.textContent = buildRoleLibrarySessionRoleDescription(detail);
                renderRuntimeMeta(detail);
                detailLoader.remove();
                showToast?.('角色详情已加载', 'success');
            }
        })
        : null;

    const runtimeEditor = canEditRoleRuntimeModel(role)
        ? buildRoleRuntimeEditor(role, {
            getRoleRuntimeModel,
            getRuntimeModelCandidates,
            onApplyRoleRuntimeModel,
            showToast
        })
        : null;

    return {
        description,
        runtimeMeta,
        detailLoader,
        runtimeEditor
    };
}
