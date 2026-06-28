import {
    applyRoleDraftToEphemeralForm,
    readRoleDraftFromEphemeralForm
} from './role-draft-form-fields.js';
import { createClearRoleIdeaDraftAction } from './role-draft-form-clear-action.js';
import { createSyncRoleDraftFromFormAction } from './role-draft-form-sync-action.js';

export function createRoleDraftFormManager(deps) {
    const {
        getDom,
        getLatestRoleDraft,
        setLatestRoleDraft,
        setLatestRoleDraftMeta,
        normalizeRoleDraft,
        hasMeaningfulRoleDraft,
        defaultSharedNotebook,
        renderRoleStudio,
        renderRuntimeModelOptions
    } = deps;

    function applyRoleDraftToForm(draft) {
        applyRoleDraftToEphemeralForm({
            getDom,
            draft,
            renderRuntimeModelOptions
        });
    }

    function readRoleDraftFromForm() {
        return readRoleDraftFromEphemeralForm({
            getDom,
            latestRoleDraft: getLatestRoleDraft()
        });
    }

    return {
        clearRoleIdeaDraft: createClearRoleIdeaDraftAction(deps),
        applyRoleDraftToForm,
        readRoleDraftFromForm,
        syncRoleDraftFromForm: createSyncRoleDraftFromFormAction({
            readRoleDraftFromForm,
            setLatestRoleDraft,
            hasMeaningfulRoleDraft,
            normalizeRoleDraft,
            getLatestRoleDraft,
            defaultSharedNotebook,
            renderRoleStudio
        })
    };
}
