import { buildRoleDraftStatusState } from './role-draft-status.js';
import { applyRoleDraftResult } from './role-draft-action-ui.js';

export function applyGeneratedRoleDraftResult(deps) {
    const {
        dom,
        generated,
        describeRoleDraftGeneration,
        setLatestRoleDraft,
        setLatestRoleDraftMeta,
        setAdvancedRoleEditorExpanded,
        applyRoleDraftToForm
    } = deps;

    applyRoleDraftResult({
        dom,
        draft: generated.draft,
        draftMeta: generated.draftMeta,
        usedFallback: generated.usedFallback,
        describeRoleDraftGeneration,
        setLatestRoleDraft,
        setLatestRoleDraftMeta,
        setAdvancedRoleEditorExpanded,
        applyRoleDraftToForm,
        buildRoleDraftStatusState
    });
}
