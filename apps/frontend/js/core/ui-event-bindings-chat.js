export function bindChatEvents(deps) {
    const {
        dom,
        startSessionWithManagedProfile,
        renderAll,
        sendMessage,
        clearLatestSelectionTrace,
        adjustTextareaHeight,
        renderRoleSelectionSummary,
        fileToDataUrl,
        setSelectedImageBase64,
        clearSelectedImage
    } = deps;

    dom.newChatButton.addEventListener('click', async () => {
        await startSessionWithManagedProfile();
        renderAll();
    });

    dom.sendButton.addEventListener('click', async () => {
        await sendMessage();
    });

    dom.messageInput.addEventListener('keydown', async event => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            await sendMessage();
        }
    });

    dom.messageInput.addEventListener('input', () => {
        clearLatestSelectionTrace();
        adjustTextareaHeight(dom.messageInput);
        renderRoleSelectionSummary();
    });

    dom.imageInput.addEventListener('change', async event => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        const imageBase64 = await fileToDataUrl(file);
        setSelectedImageBase64(imageBase64);
        dom.imagePreview.src = imageBase64;
        dom.imagePreviewArea.style.display = 'block';
    });

    dom.removeImageButton.addEventListener('click', () => {
        clearSelectedImage();
    });
}
