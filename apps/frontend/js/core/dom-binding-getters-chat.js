const byId = id => doc => doc.getElementById(id);

export const DOM_BINDING_CHAT_GETTERS = {
    chatMessages: byId('chat-messages'),
    messageInput: byId('message-input'),
    sendButton: byId('send-button'),
    newChatButton: byId('new-chat-button'),
    imageInput: byId('image-input'),
    imagePreviewArea: byId('image-preview-area'),
    imagePreview: byId('image-preview'),
    removeImageButton: byId('remove-image-button'),
    currentRoundAisContainer: byId('current-round-ais'),
    floatingAiStatusWindow: byId('floating-ai-status-window')
};
