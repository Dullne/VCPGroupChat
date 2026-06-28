import { populateModelSelectOptions } from './runtime-model-option-select.js';
import {
    buildRoleStudioModelMeta,
    buildRuntimeModelMeta
} from './runtime-model-option-meta.js';

export function createRuntimeModelOptionRenderers(deps) {
    const {
        getDom,
        getSelectedRoleStudioModel,
        getRoleStudioModels,
        getRuntimeModelCandidates,
        getCurrentDraftRuntimeModelValue
    } = deps;

    function renderRoleStudioModelOptions() {
        const availableModels = getRoleStudioModels();
        const selectedRoleStudioModel = getSelectedRoleStudioModel();
        const dom = getDom();
        const select = dom.roleIdeaModelSelect;
        populateModelSelectOptions(select, availableModels, '自动优选（推荐）');

        const activeValue = availableModels.includes(selectedRoleStudioModel) ? selectedRoleStudioModel : '';
        select.value = activeValue;
        select.disabled = false;
        dom.roleIdeaModelMeta.textContent = buildRoleStudioModelMeta(availableModels, activeValue);
    }

    function renderRuntimeModelOptions() {
        const dom = getDom();
        const currentValue = getCurrentDraftRuntimeModelValue();
        const availableModels = getRuntimeModelCandidates(currentValue);
        const select = dom.roleRuntimeModelSelect;
        populateModelSelectOptions(select, availableModels, '跟随核心默认（推荐）');

        select.value = currentValue && availableModels.includes(currentValue) ? currentValue : '';
        dom.roleRuntimeModelMeta.textContent = buildRuntimeModelMeta(availableModels, currentValue);
    }

    return {
        renderRoleStudioModelOptions,
        renderRuntimeModelOptions
    };
}
