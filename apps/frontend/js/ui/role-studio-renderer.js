import { applyRoleStudioEmptyDraftState } from './role-studio-renderer-empty-state.js';
import { applyRoleStudioFilledDraftState } from './role-studio-renderer-filled-state.js';
import {
    describeRoleStudioContextMode,
    normalizeRoleStudioContextMode
} from '../core/role-studio-context-mode.js';
import { translateUiText } from '../core/i18n.js';

export function createRoleStudioRenderer(deps) {
    const {
        getDom,
        getLatestRoleDraft,
        getLatestRoleDraftMeta,
        getAdvancedRoleEditorExpanded,
        getSelectedRoleStudioContextMode,
        getManagedProfile,
        hasMeaningfulRoleDraft,
        renderRoleStudioModelOptions,
        renderRuntimeModelOptions,
        renderRoleStudioSources,
        buildRoleDraftMetaLabels,
        summarizeInline
    } = deps;

    function renderRoleStudio() {
        const dom = getDom();
        const draft = getLatestRoleDraft();
        const latestRoleDraftMeta = getLatestRoleDraftMeta();
        const advancedRoleEditorExpanded = getAdvancedRoleEditorExpanded();
        const hasDraft = hasMeaningfulRoleDraft(draft);
        renderRoleStudioSources();
        renderRoleStudioModelOptions();
        renderRuntimeModelOptions();
        const selectedContextMode = normalizeRoleStudioContextMode(getSelectedRoleStudioContextMode?.());
        if (dom.roleStudioContextModeSelect) {
            dom.roleStudioContextModeSelect.value = selectedContextMode;
        }
        if (dom.roleStudioContextMeta) {
            dom.roleStudioContextMeta.textContent = translateUiText(describeRoleStudioContextMode(selectedContextMode, {
                profile: getManagedProfile?.()
            }));
        }

        dom.roleDraftEmpty.classList.toggle('role-draft-content-hidden', hasDraft);
        dom.roleDraftContent.classList.toggle('role-draft-content-hidden', !hasDraft);
        dom.roleAdvancedEditorSection.classList.toggle('role-studio-editor-hidden', !advancedRoleEditorExpanded);
        dom.toggleAdvancedRoleFormBtn.textContent = advancedRoleEditorExpanded
            ? translateUiText(translateUiText('收起高级编辑'))
            : hasDraft
                ? translateUiText(translateUiText('调整高级编辑'))
                : '展开高级编辑';

        if (!hasDraft) {
            applyRoleStudioEmptyDraftState(dom);
            return;
        }

        applyRoleStudioFilledDraftState({
            dom,
            draft,
            latestRoleDraftMeta,
            buildRoleDraftMetaLabels,
            summarizeInline
        });
    }

    return {
        renderRoleStudio
    };
}
