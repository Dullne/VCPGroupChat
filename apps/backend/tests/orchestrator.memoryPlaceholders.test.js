const assert = require('assert');

const Orchestrator = require('../src/services/orchestrator');

function countOccurrences(text, needle) {
    return String(text || '').split(needle).length - 1;
}

function testRoleMemoryNotebooksAreInjectedFromConfig() {
    const orchestrator = new Orchestrator({
        sessionService: null,
        vcpCoreClient: null,
        userName: '用户',
        userPrompt: ''
    });

    const messages = orchestrator.buildStreamChatMessages({
        roleSpec: {
            id: 'ji_archivist',
            name: '犬娘小吉',
            template_content: '你是犬娘小吉。\n你的私有记忆入口：{{小吉日记本}}',
            memory: {
                privateNotebook: '小吉',
                knowledgeNotebook: '小吉的知识',
                sharedNotebooks: ['公共', '团队']
            },
            responsibilities: [],
            temperature: 0.6
        },
        profile: {
            name: '默认群组',
            group_prompt: '团队共享记忆如下：{{公共日记本}}。'
        },
        phase: '',
        fullHistory: []
    });

    const systemPrompt = messages[0].content;
    assert.match(systemPrompt, /{{小吉日记本}}/);
    assert.match(systemPrompt, /{{小吉的知识日记本}}/);
    assert.match(systemPrompt, /{{团队日记本}}/);
    assert.strictEqual(countOccurrences(systemPrompt, '{{小吉日记本}}'), 1);
    assert.strictEqual(countOccurrences(systemPrompt, '{{公共日记本}}'), 1);
    assert.match(systemPrompt, /不要主动声明.*为空.*不可读/);
}

function testRuntimeMemoryStatusHistoryIsOmittedFromPrompt() {
    const orchestrator = new Orchestrator({
        sessionService: null,
        vcpCoreClient: null,
        userName: '用户',
        userPrompt: ''
    });

    const messages = orchestrator.buildStreamChatMessages({
        roleSpec: {
            id: 'ji_archivist',
            name: '犬娘小吉',
            template_content: '你是犬娘小吉。',
            memory: {
                privateNotebook: '小吉',
                knowledgeNotebook: '小吉的知识',
                sharedNotebooks: ['公共']
            },
            responsibilities: [],
            temperature: 0.6
        },
        profile: {
            name: '默认群组',
            group_prompt: '团队共享记忆如下：{{公共日记本}}。'
        },
        phase: '',
        fullHistory: [
            {
                role: 'user',
                speaker_name: '用户',
                content: { text: '你们好啊' }
            },
            {
                role: 'assistant',
                speaker_name: '犬娘小吉',
                content: {
                    text: '我是犬娘小吉，负责补全背景和区分记忆边界。当前公共记忆无可用内容，私有记忆暂不可读。'
                }
            },
            {
                role: 'assistant',
                speaker_name: '犬娘小吉',
                content: { text: '用户，今天需要为您做些什么？' }
            },
            {
                role: 'user',
                speaker_name: '用户',
                content: { text: 'hello' }
            }
        ]
    });

    const promptText = messages
        .map(message => typeof message.content === 'string' ? message.content : JSON.stringify(message.content))
        .join('\n');

    assert.doesNotMatch(promptText, /私有记忆暂不可读/);
    assert.doesNotMatch(promptText, /公共记忆无可用内容/);
    assert.match(promptText, /用户: 你们好啊/);
    assert.match(promptText, /犬娘小吉: 用户，今天需要为您做些什么？/);
    assert.match(promptText, /用户: hello/);
}

function testNullMemoryConfigDoesNotCrashPromptBuild() {
    const orchestrator = new Orchestrator({
        sessionService: null,
        vcpCoreClient: null,
        userName: '用户',
        userPrompt: ''
    });

    assert.doesNotThrow(() => orchestrator.buildStreamChatMessages({
        roleSpec: {
            id: 'no_memory_role',
            name: '无记忆角色',
            template_content: '你是无记忆角色。',
            memory: null,
            responsibilities: [],
            temperature: 0.6
        },
        profile: {
            name: '冒烟群组',
            group_prompt: '自动测试群组。'
        },
        phase: 'discuss',
        fullHistory: []
    }));
}

function testPrivateKnowledgePlaceholdersUsePersonIdWhenAvailable() {
    const orchestrator = new Orchestrator({
        sessionService: null,
        vcpCoreClient: null,
        userName: '用户',
        userPrompt: '',
        personIdentityService: null
    });

    const messages = orchestrator.buildStreamChatMessages({
        roleSpec: {
            id: 'ji_archivist',
            person_id: 'person_ji_archivist',
            name: '犬娘小吉',
            template_content: '你是犬娘小吉。',
            memory: {
                privateNotebook: '小吉',
                knowledgeNotebook: '小吉的知识',
                sharedNotebooks: ['公共']
            },
            responsibilities: [],
            temperature: 0.6
        },
        profile: { name: '默认群组', group_prompt: '' },
        phase: '',
        fullHistory: []
    });

    const systemPrompt = messages[0].content;
    // private/knowledge 用 person_id 派生命名空间
    assert.match(systemPrompt, /{{person-person_ji_archivist-private日记本}}/);
    assert.match(systemPrompt, /{{person-person_ji_archivist-knowledge日记本}}/);
    // 共享本 v1 保持显示名
    assert.match(systemPrompt, /{{公共日记本}}/);
    // 不应再注入显示名版本的 private/knowledge 占位符
    assert.doesNotMatch(systemPrompt, /{{小吉日记本}}/);
    assert.doesNotMatch(systemPrompt, /{{小吉的知识日记本}}/);
}

testRoleMemoryNotebooksAreInjectedFromConfig();
testRuntimeMemoryStatusHistoryIsOmittedFromPrompt();
testNullMemoryConfigDoesNotCrashPromptBuild();
testPrivateKnowledgePlaceholdersUsePersonIdWhenAvailable();
console.log('orchestrator.memoryPlaceholders.test.js passed');
