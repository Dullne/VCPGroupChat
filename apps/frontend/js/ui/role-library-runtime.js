import {
    createRenderRoleLibraryImportSourceListAction,
    createRenderRoleLibrarySessionRoleListAction
} from './role-library-runtime-render-actions.js';

export function createRoleLibraryRuntime(deps) {
    return {
        renderImportSourceList: createRenderRoleLibraryImportSourceListAction(deps),
        renderSessionRoleList: createRenderRoleLibrarySessionRoleListAction(deps)
    };
}
