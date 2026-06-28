import { DOM_BINDING_GETTERS } from './dom-binding-getters.js';

export function createDomBindings(doc = document) {
    return Object.entries(DOM_BINDING_GETTERS).reduce((acc, [key, getter]) => {
        acc[key] = getter(doc);
        return acc;
    }, {});
}
