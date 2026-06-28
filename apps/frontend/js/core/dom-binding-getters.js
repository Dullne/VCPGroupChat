import { DOM_BINDING_WORKSPACE_GETTERS } from './dom-binding-getters-workspace.js';
import { DOM_BINDING_ROLE_GETTERS } from './dom-binding-getters-role.js';
import { DOM_BINDING_CHAT_GETTERS } from './dom-binding-getters-chat.js';

export const DOM_BINDING_GETTERS = {
    ...DOM_BINDING_WORKSPACE_GETTERS,
    ...DOM_BINDING_ROLE_GETTERS,
    ...DOM_BINDING_CHAT_GETTERS
};
