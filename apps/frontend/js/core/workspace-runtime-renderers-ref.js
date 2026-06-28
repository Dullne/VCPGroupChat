export function createWorkspaceRenderersRef() {
    let workspaceRenderers = null;

    function setWorkspaceRenderers(nextWorkspaceRenderers) {
        workspaceRenderers = nextWorkspaceRenderers;
    }

    function getWorkspaceRenderers() {
        return workspaceRenderers;
    }

    return {
        setWorkspaceRenderers,
        getWorkspaceRenderers
    };
}
