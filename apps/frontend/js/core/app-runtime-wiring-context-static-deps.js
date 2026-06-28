import {
    formatProfileOptionLabel as formatProfileOptionLabelModule,
    getProfileModeLabel as getProfileModeLabelModule,
    getProfileModeDetail as getProfileModeDetailModule,
    getMentionedRoleIdsFromText as getMentionedRoleIdsFromTextModule
} from './domain-helpers.js';
import {
    getRoleStudioModelsFromBootstrap,
    getRoleRuntimeModel as getRoleRuntimeModelFromRole,
    getRuntimeModelCandidates as getRuntimeModelCandidatesFromData
} from './model-preferences.js';
import {
    renderFloatingRoleWindow,
    appendChatMessage,
    adjustTextareaHeight as adjustTextareaHeightDom,
    scrollToBottom as scrollToBottomDom,
    toggleModalOpen
} from '../ui/runtime-widgets.js';
import {
    buildAvatarDataUrl as buildAvatarDataUrlModule,
    escapeHtml as escapeHtmlModule,
    summarizeInline as summarizeInlineModule,
    formatDateTime as formatDateTimeModule
} from '../utils/formatting.js';
import { showToast } from '../utils/ui-helpers.js';
import {
    CONFIG_FILE,
    DEFAULT_SHARED_NOTEBOOK,
    DARK_MODE_STORAGE_KEY,
    ROLE_STUDIO_MODEL_STORAGE_KEY,
    ROLE_RUNTIME_MODEL_STORAGE_KEY,
    ROLE_STUDIO_ENGINE_STORAGE_KEY,
    ROLE_STUDIO_REFERENCES_STORAGE_KEY
} from './constants.js';

export function buildRuntimeWiringStaticDeps(bindUi) {
    return {
        defaultSharedNotebook: DEFAULT_SHARED_NOTEBOOK,
        roleStudioStorageKey: ROLE_STUDIO_MODEL_STORAGE_KEY,
        roleRuntimeStorageKey: ROLE_RUNTIME_MODEL_STORAGE_KEY,
        roleStudioEngineStorageKey: ROLE_STUDIO_ENGINE_STORAGE_KEY,
        roleStudioReferencesStorageKey: ROLE_STUDIO_REFERENCES_STORAGE_KEY,
        getRoleStudioModelsFromBootstrap,
        getRoleRuntimeModelFromRole,
        getRuntimeModelCandidatesFromData,
        formatProfileOptionLabel: formatProfileOptionLabelModule,
        getProfileModeLabel: getProfileModeLabelModule,
        getProfileModeDetail: getProfileModeDetailModule,
        getMentionedRoleIdsFromText: getMentionedRoleIdsFromTextModule,
        showToast,
        formatDateTime: formatDateTimeModule,
        summarizeInline: summarizeInlineModule,
        renderFloatingRoleWindow,
        appendChatMessage,
        toggleModalOpen,
        adjustTextareaHeightDom,
        scrollToBottomDom,
        buildAvatarDataUrl: buildAvatarDataUrlModule,
        escapeHtml: escapeHtmlModule,
        getDocument: () => document,
        configFile: CONFIG_FILE,
        bindUi,
        darkModeStorageKey: DARK_MODE_STORAGE_KEY
    };
}
