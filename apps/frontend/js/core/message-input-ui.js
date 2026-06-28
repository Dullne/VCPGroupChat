export function createMessageInputUiHelpers(deps) {
    const {
        getDom,
        getSelectedImageBase64,
        setSelectedImageBase64
    } = deps;

    function clearSelectedImage() {
        const dom = getDom();
        setSelectedImageBase64(null);
        dom.imageInput.value = '';
        dom.imagePreviewArea.style.display = 'none';
        dom.imagePreview.removeAttribute('src');
    }

    function getSendInput() {
        const dom = getDom();
        return {
            text: dom.messageInput.value.trim(),
            selectedImageBase64: getSelectedImageBase64()
        };
    }

    return {
        clearSelectedImage,
        getSendInput
    };
}
