import { createMessageInputHelpers } from './message-actions-input.js';
import { createMessageResponseHandler } from './message-actions-response.js';
import { mergeSessionMessage } from './session-event-sync.js';
import { postJsonStream } from '../utils/http.js';

const SEND_TIMEOUT_SECONDS = 600;
const IN_FLIGHT_REFRESH_INITIAL_DELAY_MS = 800;
const IN_FLIGHT_REFRESH_INTERVAL_MS = 2500;
const IN_FLIGHT_REFRESH_MAX_DURATION_MS = (SEND_TIMEOUT_SECONDS + 30) * 1000;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function createMessageActions(deps) {
    const {
        getActiveSession,
        setActiveSession,
        fetchJson,
        createSession,
        showToast,
        getDom,
        adjustTextareaHeight,
        reloadActiveSessionAndRoles,
        renderProfileSelectOptions,
        renderAll,
        scrollToBottom
    } = deps;
    const {
        buildExcludedRoleIds,
        clearSelectedImage,
        getSendInput,
        resolveIncludeRoleIds
    } = createMessageInputHelpers(deps);
    const { handleSendMessageSuccess } = createMessageResponseHandler(deps);
    let isSending = false;

    function collectSpeakingRoleIdsForRound(session, roundIndex) {
        return Array.isArray(session?.messages)
            ? session.messages
                .filter(message => message.role === 'assistant' && Number(message.round_index || 0) === Number(roundIndex))
                .map(message => message.speaker_id)
                .filter(Boolean)
            : [];
    }

    async function refreshInFlightSession(sessionId, roundIndex) {
        const currentSession = getActiveSession();
        if (!currentSession?.id || String(currentSession.id) !== String(sessionId)) {
            return false;
        }

        await reloadActiveSessionAndRoles();

        const nextSession = getActiveSession();
        if (!nextSession?.id || String(nextSession.id) !== String(sessionId)) {
            return false;
        }

        const dom = getDom();
        renderProfileSelectOptions(nextSession?.profile_id);
        dom.sessionSelect.value = nextSession.id;
        renderAll(collectSpeakingRoleIdsForRound(nextSession, roundIndex));
        scrollToBottom(dom.chatMessages);
        return true;
    }

    function startInFlightRefreshLoop(sessionId, roundIndex) {
        const loopState = { active: true };
        const startedAt = Date.now();

        void (async () => {
            await delay(IN_FLIGHT_REFRESH_INITIAL_DELAY_MS);

            while (loopState.active && Date.now() - startedAt < IN_FLIGHT_REFRESH_MAX_DURATION_MS) {
                try {
                    await refreshInFlightSession(sessionId, roundIndex);
                } catch (error) {
                    // Ignore transient refresh failures while the backend is still generating.
                }

                await delay(IN_FLIGHT_REFRESH_INTERVAL_MS);
            }
        })();

        return loopState;
    }

    function buildTemporaryMessage(sessionId, role, roundIndex) {
        const roleId = role?.id || `role_${Date.now()}`;
        return {
            id: `stream_${sessionId}_${roundIndex}_${roleId}`,
            session_id: sessionId,
            role: 'assistant',
            speaker_id: roleId,
            speaker_name: role?.name || 'AI',
            content: { text: '' },
            round_index: roundIndex,
            created_at: new Date().toISOString(),
            streaming: true
        };
    }

    function upsertStreamingMessage(sessionId, role, roundIndex, updater) {
        const currentSession = getActiveSession();
        if (!currentSession?.id || String(currentSession.id) !== String(sessionId)) {
            return;
        }

        const roleId = role?.id || '';
        const temporaryId = `stream_${sessionId}_${roundIndex}_${roleId}`;
        const messages = Array.isArray(currentSession.messages) ? [...currentSession.messages] : [];
        let index = messages.findIndex(message => message.id === temporaryId);
        if (index < 0 && roleId) {
            index = messages.findIndex(message =>
                message.streaming &&
                Number(message.round_index || 0) === Number(roundIndex) &&
                String(message.speaker_id || '') === String(roleId)
            );
        }
        if (index < 0) {
            messages.push(buildTemporaryMessage(sessionId, role, roundIndex));
            index = messages.length - 1;
        }

        const nextMessage = updater({ ...messages[index], content: { ...(messages[index].content || {}) } });
        messages[index] = nextMessage;
        setActiveSession({
            ...currentSession,
            messages
        });
    }

    function replaceStreamingMessage(sessionId, roleId, savedMessage) {
        const currentSession = getActiveSession();
        if (!currentSession?.id || String(currentSession.id) !== String(sessionId)) {
            return;
        }

        setActiveSession(mergeSessionMessage(currentSession, {
            ...savedMessage,
            speaker_id: savedMessage?.speaker_id || roleId || ''
        }));
    }

    function renderStreamingRound(sessionId, roundIndex, speakingRoleIds = []) {
        const currentSession = getActiveSession();
        if (!currentSession?.id || String(currentSession.id) !== String(sessionId)) {
            return;
        }

        const dom = getDom();
        renderProfileSelectOptions(currentSession?.profile_id);
        dom.sessionSelect.value = currentSession.id;
        renderAll(speakingRoleIds.length > 0
            ? speakingRoleIds
            : collectSpeakingRoleIdsForRound(currentSession, roundIndex));
        scrollToBottom(dom.chatMessages);
    }

    async function sendMessageStream(activeSession, payload, { clearSelectedImage, roundIndex }) {
        const sessionId = activeSession.id;
        const speakingRoleIds = new Set();
        let finalResponse = null;
        let userMessagePersisted = false;

        await postJsonStream(
            `/api/group-chat/sessions/${encodeURIComponent(sessionId)}/messages/stream`,
            payload,
            {
                timeoutSeconds: SEND_TIMEOUT_SECONDS,
                onEvent: ({ type, payload: eventPayload }) => {
                    if (!eventPayload || typeof eventPayload !== 'object') {
                        return;
                    }

                    if (type === 'user_message' && eventPayload.user_message) {
                        userMessagePersisted = true;
                        const currentSession = getActiveSession();
                        if (currentSession?.id && String(currentSession.id) === String(sessionId)) {
                            setActiveSession(mergeSessionMessage(currentSession, eventPayload.user_message));
                            renderStreamingRound(sessionId, roundIndex, [...speakingRoleIds]);
                        }
                    } else if (type === 'round_started') {
                        finalResponse = {
                            ...(finalResponse || {}),
                            target_roles: eventPayload.target_roles || [],
                            selection_trace: eventPayload.selection_trace || null
                        };
                    } else if (type === 'role_started') {
                        const role = eventPayload.role || {};
                        speakingRoleIds.add(role.id);
                        upsertStreamingMessage(sessionId, role, roundIndex, message => message);
                        renderStreamingRound(sessionId, roundIndex, [...speakingRoleIds]);
                    } else if (type === 'role_delta') {
                        const role = eventPayload.role || { id: eventPayload.role_id, name: eventPayload.role_name };
                        const delta = String(eventPayload.delta || '');
                        if (delta) {
                            speakingRoleIds.add(role.id);
                            upsertStreamingMessage(sessionId, role, roundIndex, message => ({
                                ...message,
                                content: {
                                    ...(message.content || {}),
                                    text: `${message.content?.text || ''}${delta}`
                                }
                            }));
                            renderStreamingRound(sessionId, roundIndex, [...speakingRoleIds]);
                        }
                    } else if (type === 'role_completed') {
                        const savedMessage = eventPayload.message;
                        if (savedMessage) {
                            speakingRoleIds.add(savedMessage.speaker_id);
                            replaceStreamingMessage(sessionId, eventPayload.role?.id, savedMessage);
                            finalResponse = {
                                ...(finalResponse || {}),
                                assistant_messages: [
                                    ...((finalResponse || {}).assistant_messages || []),
                                    savedMessage
                                ]
                            };
                            renderStreamingRound(sessionId, roundIndex, [...speakingRoleIds]);
                        }
                    } else if (type === 'role_failed') {
                        finalResponse = {
                            ...(finalResponse || {}),
                            failed_roles: [
                                ...((finalResponse || {}).failed_roles || []),
                                eventPayload.role || eventPayload
                            ]
                        };
                    } else if (type === 'round_completed') {
                        finalResponse = {
                            ...(finalResponse || {}),
                            ...eventPayload
                        };
                    } else if (type === 'error') {
                        throw new Error(eventPayload.error || '流式响应失败');
                    }
                }
            }
        );

        if (!finalResponse?.session) {
            throw new Error('流式响应没有返回最终会话状态');
        }

        await handleSendMessageSuccess(finalResponse, {
            clearSelectedImage,
            skipComposerReset: true
        });

        return {
            userMessagePersisted
        };
    }

    async function sendMessage() {
        if (isSending) {
            return;
        }

        const dom = getDom();
        const draftText = dom.messageInput.value;
        const { text, selectedImageBase64 } = getSendInput();
        if (!text && !selectedImageBase64) {
            return;
        }

        let activeSession = getActiveSession();
        if (!activeSession?.id) {
            await createSession();
            activeSession = getActiveSession();
        }

        const includeRoleIds = resolveIncludeRoleIds(text);
        if (!Array.isArray(includeRoleIds)) {
            return;
        }

        const requestSessionId = activeSession.id;
        const roundIndex = (activeSession.messages?.at(-1)?.round_index || 0) + 1;
        let inFlightRefresh = null;
        const body = {
            content: {
                text,
                ...(selectedImageBase64 ? { image: selectedImageBase64 } : {})
            },
            include_role_ids: includeRoleIds,
            exclude_role_ids: buildExcludedRoleIds()
        };

        isSending = true;
        dom.sendButton.disabled = true;
        dom.messageInput.value = '';
        if (typeof adjustTextareaHeight === 'function') {
            adjustTextareaHeight(dom.messageInput);
        }

        try {
            await sendMessageStream(activeSession, body, {
                clearSelectedImage,
                roundIndex
            });
        } catch (error) {
            try {
                const latestSession = getActiveSession();
                const userMessageAlreadyPersisted = Array.isArray(latestSession?.messages)
                    && latestSession.messages.some(message =>
                        message.role === 'user' &&
                        Number(message.round_index || 0) === Number(roundIndex) &&
                        String(message.content?.text || '') === String(text || '')
                    );
                if (userMessageAlreadyPersisted) {
                    inFlightRefresh = startInFlightRefreshLoop(requestSessionId, roundIndex);
                    await refreshInFlightSession(requestSessionId, roundIndex);
                    clearSelectedImage();
                    showToast(`流式响应中断：${error.message}`, 'warning');
                    return;
                }

                const response = await fetchJson(`/api/group-chat/sessions/${encodeURIComponent(activeSession.id)}/messages`, {
                    method: 'POST',
                    body,
                    timeoutSeconds: SEND_TIMEOUT_SECONDS
                });
                await handleSendMessageSuccess(response, {
                    clearSelectedImage,
                    skipComposerReset: true
                });
                return;
            } catch (refreshError) {
                try {
                    await refreshInFlightSession(requestSessionId, roundIndex);
                } catch (finalRefreshError) {
                    // Ignore refresh errors and fall back to local composer recovery below.
                }
            }

            if (!dom.messageInput.value) {
                dom.messageInput.value = draftText;
                if (typeof adjustTextareaHeight === 'function') {
                    adjustTextareaHeight(dom.messageInput);
                }
            }
            showToast(`发送失败：${error.message}`, 'danger');
        } finally {
            if (inFlightRefresh) {
                inFlightRefresh.active = false;
            }
            dom.sendButton.disabled = false;
            if (document.activeElement !== dom.messageInput) {
                dom.messageInput.focus();
            }
            isSending = false;
        }
    }

    return {
        sendMessage,
        buildExcludedRoleIds,
        clearSelectedImage
    };
}
