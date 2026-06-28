export function createBootstrapConfigHelpers(deps) {
    const {
        getDocument,
        setConfig,
        configFile
    } = deps;

    function configureMarked() {
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                breaks: true,
                gfm: true
            });
        }
    }

    async function loadConfig() {
        const doc = getDocument();
        await new Promise((resolve, reject) => {
            const script = doc.createElement('script');
            script.src = configFile;
            script.onload = () => {
                if (!window.loadedConfig) {
                    reject(new Error('缺少 window.loadedConfig'));
                    return;
                }
                setConfig(window.loadedConfig);
                delete window.loadedConfig;
                resolve();
            };
            script.onerror = () => reject(new Error(`无法加载 ${configFile}`));
            doc.body.appendChild(script);
        });
    }

    return {
        configureMarked,
        loadConfig
    };
}
