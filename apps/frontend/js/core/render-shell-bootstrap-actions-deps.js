export function buildRenderShellBootstrapActionsDeps(deps) {
    const { getSelectedProfileIdForBootstrap, ...rest } = deps;
    return {
        ...rest,
        getSelectedProfileId: getSelectedProfileIdForBootstrap,
    };
}
