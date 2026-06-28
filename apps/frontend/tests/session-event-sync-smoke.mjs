import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    createSessionEventSyncManager,
    mergeSessionMessage
} from '../js/core/session-event-sync.js';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = relativePath => readFileSync(join(repoRoot, relativePath), 'utf8');

function testMergeSessionMessageDedupesAndReplacesStreamingPlaceholder() {
    const session = {
        id: 'sess_a',
        messages: [
            {
                id: 'msg_user',
                session_id: 'sess_a',
                role: 'user',
                content: { text: 'hello' },
                round_index: 1
            },
            {
                id: 'stream_sess_a_1_role_a',
                session_id: 'sess_a',
                role: 'assistant',
                speaker_id: 'role_a',
                content: { text: 'partial' },
                round_index: 1,
                streaming: true
            }
        ]
    };
    const savedAssistant = {
        id: 'msg_assistant',
        session_id: 'sess_a',
        role: 'assistant',
        speaker_id: 'role_a',
        content: { text: 'final' },
        round_index: 1
    };

    const merged = mergeSessionMessage(session, savedAssistant);
    assert.deepEqual(
        merged.messages.map(message => message.id),
        ['msg_user', 'msg_assistant']
    );
    assert.equal(merged.messages[1].content.text, 'final');

    const duplicate = mergeSessionMessage(merged, {
        ...savedAssistant,
        content: { text: 'final updated' }
    });
    assert.equal(duplicate.messages.length, 2);
    assert.equal(duplicate.messages[1].content.text, 'final updated');
}

async function testSessionEventManagerAppliesActiveSessionMessageEvents() {
    let activeSession = {
        id: 'sess_a',
        profile_id: 'profile_a',
        messages: []
    };
    const calls = [];
    const dom = {
        sessionSelect: { value: '' },
        chatMessages: { scrollTop: 0, scrollHeight: 0 }
    };
    const manager = createSessionEventSyncManager({
        getActiveSession: () => activeSession,
        setActiveSession: nextSession => {
            activeSession = nextSession;
            calls.push('setActiveSession');
        },
        getDom: () => dom,
        refreshSessionsList: async () => {
            calls.push('refreshSessionsList');
        },
        reloadActiveSessionAndRoles: async () => {
            calls.push('reloadActiveSessionAndRoles');
        },
        renderProfileSelectOptions: profileId => {
            calls.push(`renderProfileSelectOptions:${profileId}`);
        },
        renderAll: () => {
            calls.push('renderAll');
        },
        scrollToBottom: () => {
            calls.push('scrollToBottom');
        },
        showToast: message => {
            calls.push(`toast:${message}`);
        },
        eventSourceFactory: null
    });

    await manager.handleEvent({
        type: 'message_added',
        session_id: 'sess_a',
        message: {
            id: 'msg_1',
            session_id: 'sess_a',
            role: 'user',
            content: { text: 'hello from another tab' },
            round_index: 1
        }
    });

    assert.equal(activeSession.messages.length, 1);
    assert.equal(activeSession.messages[0].content.text, 'hello from another tab');
    assert.ok(calls.includes('refreshSessionsList'));
    assert.ok(calls.includes('renderAll'));
    assert.equal(dom.sessionSelect.value, 'sess_a');
}

testMergeSessionMessageDedupesAndReplacesStreamingPlaceholder();
await testSessionEventManagerAppliesActiveSessionMessageEvents();

const messageActionsSource = read('js/core/message-actions.js');
assert.match(messageActionsSource, /mergeSessionMessage/, 'sender stream events dedupe against global session events');
console.log('session-event-sync-smoke.mjs passed');
