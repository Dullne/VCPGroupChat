export function renderShellSessionMessages(deps) {
    const {
        getDom,
        getActiveSession,
        appendMessage,
        scrollToBottom
    } = deps;

    const dom = getDom();
    const activeSession = getActiveSession();
    dom.chatMessages.innerHTML = '';
    for (const message of activeSession?.messages || []) {
        appendMessage(dom.chatMessages, message);
    }
    scrollToBottom(dom.chatMessages);
}
