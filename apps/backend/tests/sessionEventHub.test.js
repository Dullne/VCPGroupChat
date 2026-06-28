const assert = require('assert');

const { SessionEventHub } = require('../src/services/sessionEventHub');

function createFakeResponse() {
    const chunks = [];
    const headers = {};
    return {
        destroyed: false,
        writableEnded: false,
        headers,
        setHeader(name, value) {
            headers[name] = value;
        },
        flushHeadersCalled: false,
        flushHeaders() {
            this.flushHeadersCalled = true;
        },
        write(chunk) {
            chunks.push(String(chunk));
        },
        end() {
            this.writableEnded = true;
        },
        get body() {
            return chunks.join('');
        }
    };
}

function createFakeRequest({ since } = {}) {
    const handlers = new Map();
    return {
        headers: {},
        query: since ? { since } : {},
        on(eventName, handler) {
            handlers.set(eventName, handler);
        },
        close() {
            handlers.get('close')?.();
        }
    };
}

function testPublishesSseEventsAndReplaysMissedHistory() {
    const hub = new SessionEventHub({ historyLimit: 5, keepAliveMs: 60_000 });
    const firstEvent = hub.publish('message_added', {
        session_id: 'sess_a',
        message: { id: 'msg_1', content: { text: 'hello' } }
    });
    const secondEvent = hub.publish('round_completed', {
        session_id: 'sess_a',
        session: { id: 'sess_a', messages: [{ id: 'msg_1' }] }
    });

    assert.strictEqual(hub.getClientCount(), 0);
    assert.deepStrictEqual(
        hub.getEventsAfter(firstEvent.event_id).map(event => event.event_id),
        [secondEvent.event_id]
    );

    const req = createFakeRequest({ since: firstEvent.event_id });
    const res = createFakeResponse();
    hub.subscribe(req, res);

    assert.match(res.headers['Content-Type'], /text\/event-stream/);
    assert.match(res.headers['Cache-Control'], /no-cache/);
    assert.strictEqual(hub.getClientCount(), 1);
    assert.match(res.body, /event: groupchat_event/);
    assert.match(res.body, /"type":"round_completed"/);
    assert.doesNotMatch(res.body, /"type":"message_added"/);

    hub.publish('message_added', {
        session_id: 'sess_b',
        message: { id: 'msg_2', content: { text: 'world' } }
    });
    assert.match(res.body, /"session_id":"sess_b"/);
    assert.match(res.body, /"id":"msg_2"/);

    const bodyBeforeClose = res.body;
    req.close();
    assert.strictEqual(hub.getClientCount(), 0);
    hub.publish('message_added', {
        session_id: 'sess_c',
        message: { id: 'msg_3' }
    });
    assert.strictEqual(res.body, bodyBeforeClose);

    hub.closeAll();
}

testPublishesSseEventsAndReplaysMissedHistory();
console.log('sessionEventHub.test.js passed');
