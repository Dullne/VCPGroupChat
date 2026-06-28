import {
    createRenderRoleLibraryImportSourceListAction,
    createRenderRoleLibrarySessionRoleListAction
} from './role-library-runtime-render-actions.js';
import { buildRoleLibraryCatalogGetter } from './role-library-runtime-catalog.js';

export function createRoleLibraryRuntime(deps) {
    return {
        renderImportSourceList: createRenderRoleLibraryImportSourceListAction(deps),
        renderSessionRoleList: createRenderRoleLibrarySessionRoleListAction(deps),
        getCatalogItem: buildRoleLibraryCatalogGetter(deps.getExternalImportSources)
    };
}
