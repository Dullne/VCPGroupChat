export function mountApp(deps) {
    const {
        getDocument,
        isBootstrapped,
        markBootstrapped,
        setDom,
        createDomBindings,
        initialize,
        showToast
    } = deps;

    const doc = getDocument();

    const bootstrapApp = () => {
        if (isBootstrapped()) {
            return;
        }

        markBootstrapped();
        setDom(createDomBindings(doc));

        initialize().catch(error => {
            console.error(error);
            showToast(`初始化失败：${error.message}`, 'danger');
        });
    };

    if (doc.readyState === 'loading') {
        doc.addEventListener('DOMContentLoaded', bootstrapApp, { once: true });
    } else {
        bootstrapApp();
    }
}
