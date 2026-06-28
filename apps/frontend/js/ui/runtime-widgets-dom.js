export function adjustTextareaHeight(textarea) {
    textarea.style.height = 'auto';
    const maxHeight = parseInt(window.getComputedStyle(textarea).maxHeight, 10) || 180;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
}

export function scrollToBottom(container) {
    container.scrollTop = container.scrollHeight;
}

export function toggleModalOpen(modalEl, open) {
    modalEl.classList.toggle('role-manager-open', open);
}
