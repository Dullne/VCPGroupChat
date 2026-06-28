import { createAsyncActionButton } from './role-card-ui.js';
import { state } from '../core/state.js';
import { formatRoleRuntimeModelSummary } from '../core/model-preferences.js';

export function canEditRoleRuntimeModel(role) {
    if (!role) {
        return false;
    }
    if (role.source === 'ephemeral') {
        return !role.promoted_core_role_id;
    }
    return true;
}

export function buildRoleRuntimeSummary(role, getRoleRuntimeModel) {
    return formatRoleRuntimeModelSummary(role, state.bootstrapData);
}

export function buildRoleRuntimeEditor(role, deps) {
    const {
        getRoleRuntimeModel,
        getRuntimeModelCandidates,
        onApplyRoleRuntimeModel,
        showToast
    } = deps;

    const wrapper = document.createElement('div');
    wrapper.className = 'role-inline-editor';

    const currentModel = getRoleRuntimeModel(role);
    const select = document.createElement('select');
    select.className = 'role-inline-select';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '跟随核心默认';
    select.appendChild(defaultOption);

    for (const model of getRuntimeModelCandidates(currentModel)) {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        select.appendChild(option);
    }

    select.value = currentModel;
    wrapper.appendChild(select);
    wrapper.appendChild(createAsyncActionButton({
        label: '应用模型',
        handler: async () => {
            await onApplyRoleRuntimeModel(role, select.value);
        },
        variant: 'secondary',
        showToast
    }));

    return wrapper;
}
