import { getBaseUrl } from '../utils/http.js';

const RECONNECT_DELAY_MS = 2500;

function normalizeMessageId(message) {
    return String(message?.id || '').trim();
}

function isSameStreamingMessage(left, right) {
    return Boolean(
        left?.streaming &&
        !right?.streaming &&
        left?.speaker_id &&
        right?.speaker_id &&
        String(left.speaker_id) === String(right.speaker_id) &&
        Number(left.round_index || 0) === Number(right.round_index || 0)
    );
}

export function mergeSessionMessage(session, incomingMessage) {
    if (!session || !incomingMessage) {
        return session;
    }

    const incomingId = normalizeMessageId(incomingMessage);
    const messages = Array.isArray(session.messages) ? [...session.messages] : [];
    let index = incomingId
        ? messages.findIndex(message => normalizeMessageId(message) === incomingId)
        : -1;

    if (index < 0) {
        index = messages.findIndex(message => isSameStreamingMessage(message, incomingMessage));
    }

    if (index >= 0) {
        messages[index] = {
            ...messages[index],
            ...incomingMessage,
            content: {
                ...(messages[index].content || {}),
                ...(incomingMessage.content || {})
            },
            streaming: Boolean(incomingMessage.streaming)
        };
        if (!incomingMessage.streaming) {
            delete messages[index].streaming;
        }
    } else {
        messages.push(incomingMessage);
    }

    return {
        ...session,
        messages
    };
}

function isActiveSessionEvent(activeSession, event) {
    return Boolean(
        activeSession?.id &&
        event?.session_id &&
        String(activeSession.id) === String(event.session_id)
    );
}

export function createSessionEventSyncManager(deps) {
    const {
        getActiveSession,
        setActiveSession,
        getDom,
        refreshSessionsList,
        reloadActiveSessionAndRoles,
        renderProfileSelectOptions,
        setLatestSelectionTrace,
        renderAll,
        scrollToBottom,
        showToast,
        eventSourceFactory
    } = deps;
    let eventSource = null;
    let reconnectTimer = null;
    let stopped = false;
    let lastEventId = '';

    function renderActiveSession() {
        const activeSession = getActiveSession?.();
        const dom = getDom?.();
        if (!activeSession?.id || !dom) {
            return;
        }
        renderProfileSelectOptions?.(activeSession.profile_id);
        if (dom.sessionSelect) {
            dom.sessionSelect.value = activeSession.id;
        }
        renderAll?.();
        if (dom.chatMessages) {
            scrollToBottom?.(dom.chatMessages);
        }
    }

    async function handleMessageAdded(event) {
        await refreshSessionsList?.();
        const activeSession = getActiveSession?.();
        if (!isActiveSessionEvent(activeSession, event)) {
            return;
        }
        setActiveSession?.(mergeSessionMessage(activeSession, event.message));
        renderActiveSession();
    }

    async function handleRoundCompleted(event) {
        await refreshSessionsList?.();
        const activeSession = getActiveSession?.();
        if (!isActiveSessionEvent(activeSession, event)) {
            return;
        }
        if (event.session) {
            setActiveSession?.(event.session);
        } else {
            await reloadActiveSessionAndRoles?.();
        }
        setLatestSelectionTrace?.(
            event.selection_trace && typeof event.selection_trace === 'object'
                ? event.selection_trace
                : null
        );
        renderActiveSession();
    }

    async function handleSessionChanged(event) {
        await refreshSessionsList?.();
        const activeSession = getActiveSession?.();
        if (isActiveSessionEvent(activeSession, event)) {
            await reloadActiveSessionAndRoles?.();
            renderActiveSession();
        }
    }

    async function handleEvent(event) {
        if (!event || typeof event !== 'object') {
            return;
        }
        if (event.event_id) {
            lastEventId = String(event.event_id);
        }

        if (event.type === 'message_added') {
            await handleMessageAdded(event);
        } else if (event.type === 'round_completed') {
            await handleRoundCompleted(event);
        } else if (event.type === 'session_created' || event.type === 'session_updated') {
            await handleSessionChanged(event);
        }
    }

    function resolveEventSourceFactory() {
        if (typeof eventSourceFactory === 'function') {
            return eventSourceFactory;
        }
        if (typeof window !== 'undefined' && typeof window.EventSource === 'function') {
            return url => new window.EventSource(url);
        }
        return null;
    }

    function buildEventsUrl() {
        const baseUrl = getBaseUrl();
        const url = new URL('/api/group-chat/events', baseUrl);
        if (lastEventId) {
            url.searchParams.set('since', lastEventId);
        }
        return url.toString();
    }

    function scheduleReconnect() {
        if (stopped || reconnectTimer) {
            return;
        }
        reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connect();
        }, RECONNECT_DELAY_MS);
    }

    function connect() {
        const factory = resolveEventSourceFactory();
        if (!factory || stopped || eventSource) {
            return;
        }

        eventSource = factory(buildEventsUrl());
        eventSource.addEventListener?.('groupchat_event', event => {
            try {
                void handleEvent(JSON.parse(event.data || '{}'));
            } catch (error) {
                console.warn('GroupChat event parse failed', error);
            }
        });
        eventSource.onerror = () => {
            eventSource?.close?.();
            eventSource = null;
            scheduleReconnect();
        };
    }

    function start() {
        stopped = false;
        connect();
    }

    function stop() {
        stopped = true;
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        eventSource?.close?.();
        eventSource = null;
    }

    return {
        start,
        stop,
        handleEvent
    };
}
