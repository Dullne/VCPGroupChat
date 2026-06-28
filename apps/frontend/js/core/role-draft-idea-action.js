import { generateRoleDraftFromIdea } from './role-draft-request.js';
import {
    setRoleDraftLoadingUi,
    restoreRoleDraftUi
} from './role-draft-action-ui.js';
import { buildRoleDraftGenerationContext } from './role-draft-actions-context.js';
import { applyGeneratedRoleDraftResult } from './role-draft-actions-apply.js';

export function createRoleDraftIdeaAction(deps) {
    const {
        getDom,
        getConfig,
        getActiveSession,
        getManagedProfileId,
        getSelectedRoleStudioModel,
        getSelectedRoleStudioEngine,
        getSelectedRoleStudioReferenceIds,
        fetchJson,
        applyRuntimeModelPreferenceToDraft,
        normalizeRoleDraft,
        normalizeRoleDraftMeta,
        buildRoleDraftFromIdea,
        describeRoleDraftGeneration,
        setLatestRoleDraft,
        setLatestRoleDraftMeta,
        setAdvancedRoleEditorExpanded,
        applyRoleDraftToForm,
        renderRoleStudio,
        showToast
    } = deps;

    return async function draftRoleIdeaIntoForm() {
        const dom = getDom();
        const idea = String(dom.roleIdeaInput.value || '').trim();
        if (!idea) {
            showToast('请先输入一句话角色需求', 'warning');
            return;
        }

        setRoleDraftLoadingUi(dom);

        try {
            const generated = await generateRoleDraftFromIdea(buildRoleDraftGenerationContext({
                idea,
                getConfig,
                getActiveSession,
                getManagedProfileId,
                getSelectedRoleStudioModel,
                getSelectedRoleStudioEngine,
                getSelectedRoleStudioReferenceIds,
                fetchJson,
                applyRuntimeModelPreferenceToDraft,
                normalizeRoleDraft,
                normalizeRoleDraftMeta,
                buildRoleDraftFromIdea
            }));

            applyGeneratedRoleDraftResult({
                dom,
                generated,
                describeRoleDraftGeneration,
                setLatestRoleDraft,
                setLatestRoleDraftMeta,
                setAdvancedRoleEditorExpanded,
                applyRoleDraftToForm
            });
        } finally {
            restoreRoleDraftUi(dom, renderRoleStudio);
        }
    };
}
