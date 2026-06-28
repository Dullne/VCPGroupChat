export function createRuntimeUiDomActions(deps) {
    const {
        getDom,
        toggleModalOpen,
        adjustTextareaHeightDom,
        scrollToBottomDom
    } = deps;

    function toggleRoleManager(open) {
        toggleModalOpen(getDom().roleManagerModal, open);
    }

    function adjustTextareaHeight(textarea) {
        adjustTextareaHeightDom(textarea);
    }

    function scrollToBottom(container) {
        scrollToBottomDom(container);
    }

    return {
        toggleRoleManager,
        adjustTextareaHeight,
        scrollToBottom
    };
}
