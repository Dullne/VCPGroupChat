let closeActiveImagePreview = null;

function openImagePreview(src, alt = '图片') {
    if (!src) {
        return;
    }

    closeActiveImagePreview?.();

    const previousFocus = document.activeElement;
    const overlay = document.createElement('div');
    overlay.className = 'groupchat-image-preview-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', '图片预览');

    const frame = document.createElement('div');
    frame.className = 'groupchat-image-preview-frame';

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'groupchat-image-preview-close';
    closeButton.textContent = '×';
    closeButton.setAttribute('aria-label', '关闭图片预览');

    const previewImage = document.createElement('img');
    previewImage.className = 'groupchat-image-preview-image';
    previewImage.src = src;
    previewImage.alt = alt || '图片';

    const closePreview = () => {
        document.removeEventListener('keydown', onKeydown);
        overlay.remove();
        if (closeActiveImagePreview === closePreview) {
            closeActiveImagePreview = null;
        }
        if (previousFocus && typeof previousFocus.focus === 'function') {
            previousFocus.focus({ preventScroll: true });
        }
    };

    const onKeydown = event => {
        if (event.key === 'Escape') {
            closePreview();
        }
    };

    overlay.addEventListener('click', event => {
        if (event.target === overlay) {
            closePreview();
        }
    });
    closeButton.addEventListener('click', () => {
        closePreview();
    });
    document.addEventListener('keydown', onKeydown);
    closeActiveImagePreview = closePreview;

    frame.appendChild(closeButton);
    frame.appendChild(previewImage);
    overlay.appendChild(frame);
    document.body.appendChild(overlay);
    closeButton.focus({ preventScroll: true });
}

export function appendChatMessage({
    target,
    message,
    userName,
    buildAvatarDataUrl,
    escapeHtml,
    markedRef
}) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.role === 'user' ? 'user-message' : 'ai-message'}`;

    const avatar = document.createElement('img');
    avatar.className = 'avatar';
    avatar.src = buildAvatarDataUrl(
        message.speaker_name || (message.role === 'user' ? userName : 'AI')
    );
    avatar.alt = message.speaker_name || message.role;

    const contentBlock = document.createElement('div');
    contentBlock.className = 'message-content';

    const sender = document.createElement('div');
    sender.className = 'sender';
    sender.textContent = message.speaker_name || (message.role === 'user' ? userName : 'AI');

    const wrapper = document.createElement('div');
    wrapper.className = 'content-wrapper';

    if (message.content?.image) {
        const img = document.createElement('img');
        img.src = message.content.image;
        img.alt = '图片';
        img.className = 'groupchat-image-thumbnail';
        img.loading = 'lazy';
        img.tabIndex = 0;
        img.setAttribute('role', 'button');
        img.setAttribute('aria-label', '放大预览图片');
        img.title = '点击放大预览';
        img.addEventListener('click', () => openImagePreview(message.content.image, img.alt));
        img.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openImagePreview(message.content.image, img.alt);
            }
        });
        wrapper.appendChild(img);
    }

    const content = document.createElement('div');
    content.className = 'content';
    const markdown = markedRef
        ? markedRef.parse(message.content?.text || '')
        : escapeHtml(message.content?.text || '').replace(/\n/g, '<br>');
    content.innerHTML = markdown;

    wrapper.appendChild(content);
    contentBlock.appendChild(sender);
    contentBlock.appendChild(wrapper);
    messageElement.appendChild(avatar);
    messageElement.appendChild(contentBlock);
    target.appendChild(messageElement);
}
