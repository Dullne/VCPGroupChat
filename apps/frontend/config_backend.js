(() => {
    const origin = window.location.origin;
    const backendOrigin = window.location.port === '4090'
        ? `${window.location.protocol}//${window.location.hostname}:7010`
        : origin;

    window.loadedConfig = {
        BackendUrl: backendOrigin,
        ApiTimeout: 120,
        UserAvatar: "",
        AppTitle: "VCPGroupChat - AI 项目协作室"
    };
})();
