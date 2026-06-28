import { createCoreStateValueAccessors } from './app-state-accessors-core-values.js';
import { createWorkspaceStateValueAccessors } from './app-state-accessors-workspace-values.js';

export function createStateValueAccessors(state) {
    const getStateValue = key => () => state[key];
    const setStateValue = key => value => {
        state[key] = value;
    };
    const coreAccessors = createCoreStateValueAccessors({
        state,
        getStateValue,
        setStateValue
    });
    const workspaceAccessors = createWorkspaceStateValueAccessors({
        state,
        getStateValue,
        setStateValue
    });

    return {
        ...coreAccessors,
        ...workspaceAccessors
    };
}
