import { formatRoleRuntimeModelBadge, getRoleRuntimeModelStatus } from './model-preferences.js';
import { translateUiText } from './i18n.js';

function summarizeText(value, limit = 92) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) {
        return '';
    }
    return text.length > limit ? `${text.slice(0, limit - 1)}...` : text;
}

function resolveRoleMemory(role) {
    const memory = role?.memory || role?.role_spec?.memory || {};
    const privateNotebook = memory.private_notebook || memory.privateNotebook || role?.private_notebook || '';
    const knowledgeNotebook = memory.knowledge_notebook || memory.knowledgeNotebook || role?.knowledge_notebook || '';
    return [privateNotebook, knowledgeNotebook].filter(Boolean);
}

function buildVisibleInspectorRoles(automaticRoles, selectedRoles) {
    const roleMap = new Map();
    for (const role of automaticRoles) {
        roleMap.set(role.id, role);
    }
    for (const role of selectedRoles) {
        roleMap.set(role.id, role);
    }
    return [...roleMap.values()];
}

function createRuntimeRoleChip(text, variant = 'neutral') {
    const item = document.createElement('span');
    item.className = `cognitive-runtime-role-chip cognitive-runtime-role-chip-${variant}`;
    item.textContent = text;
    return item;
}

function createMemoryBadge(text, variant = 'neutral') {
    const badge = document.createElement('span');
    badge.className = `cognitive-memory-badge cognitive-memory-badge-${variant}`;
    badge.textContent = translateUiText(text);
    return badge;
}

function appendMemoryBadges(container, badges) {
    for (const badge of badges.filter(Boolean)) {
        container.appendChild(createMemoryBadge(badge.text, badge.variant));
    }
}

function countRuntimeRows(rows, predicate) {
    return rows.filter(row => predicate(row)).length;
}

function getRuntimeRowName(row) {
    return row?.role?.name || row?.role?.id || '未知角色';
}

function getTraceRoundLabel(trace) {
    const roundIndex = Number(trace?.round_index);
    return Number.isFinite(roundIndex) && roundIndex > 0
        ? `第 ${roundIndex} 轮`
        : '最近一轮';
}

function renderRuntimeChips(container, rows, variant, emptyText) {
    container.innerHTML = '';
    const names = rows.map(getRuntimeRowName).filter(Boolean);
    if (!names.length) {
        container.appendChild(createRuntimeRoleChip(emptyText, 'neutral'));
        return;
    }
    for (const name of names.slice(0, 6)) {
        container.appendChild(createRuntimeRoleChip(name, variant));
    }
    if (names.length > 6) {
        container.appendChild(createRuntimeRoleChip(`+${names.length - 6}`, 'neutral'));
    }
}

function renderRuntimePreview(dom, preview) {
    const rows = Array.isArray(preview?.rows) ? preview.rows : [];
    const selectedRows = rows.filter(row => row.status === 'selected');
    const blockedCount = countRuntimeRows(rows, row => row.status === 'blocked');

    dom.cognitiveInspectorRuntimeState.textContent = '前端预测';
    dom.cognitiveInspectorRuntimeState.className = 'cognitive-runtime-pill cognitive-runtime-pill-preview';
    dom.cognitiveInspectorRuntimeRound.textContent = '等待后端实测';
    dom.cognitiveInspectorRuntimeSummary.textContent = selectedRows.length
        ? `预计 ${selectedRows.length} 个角色会发言，${blockedCount} 个候选暂不参与。发送消息后会替换成后端真实运行轨迹。`
        : '当前没有预计发言角色。可以先选择角色、调整群组模式，或直接发送消息让后端决定。';
    renderRuntimeChips(dom.cognitiveInspectorRuntimeRoles, selectedRows, 'preview', '暂无预计发言');
}

function renderRuntimeTrace(dom, trace, buildRoundRoleDebugFromSelectionTrace) {
    const debug = buildRoundRoleDebugFromSelectionTrace?.(trace) || { rows: [] };
    const rows = Array.isArray(debug.rows) ? debug.rows : [];
    const selectedRows = rows.filter(row => row.status === 'selected');
    const successRows = rows.filter(row => row.execution === 'ok');
    const failedRows = rows.filter(row => row.execution === 'failed' || row.execution_error);
    const targetNames = Array.isArray(trace?.target_role_names)
        ? trace.target_role_names.filter(Boolean)
        : selectedRows.map(getRuntimeRowName);
    const firstError = failedRows.find(row => row.execution_error)?.execution_error || '';

    dom.cognitiveInspectorRuntimeState.textContent = '后端实测';
    dom.cognitiveInspectorRuntimeState.className = 'cognitive-runtime-pill cognitive-runtime-pill-live';
    dom.cognitiveInspectorRuntimeRound.textContent = getTraceRoundLabel(trace);
    dom.cognitiveInspectorRuntimeSummary.textContent = [
        translateUiText(`目标 ${targetNames.length || selectedRows.length}`),
        translateUiText(`成功 ${successRows.length}`),
        translateUiText(`失败 ${failedRows.length}`)
    ].join(' · ') + (firstError ? ` · ${summarizeText(firstError, 52)}` : '');

    if (failedRows.length) {
        renderRuntimeChips(dom.cognitiveInspectorRuntimeRoles, failedRows, 'failed', '暂无失败角色');
        return;
    }

    renderRuntimeChips(
        dom.cognitiveInspectorRuntimeRoles,
        successRows.length ? successRows : selectedRows,
        'live',
        '暂无成功发言'
    );
}

function renderRuntimeInspector({
    dom,
    latestSelectionTrace,
    runtimePreview,
    buildRoundRoleDebugFromSelectionTrace
}) {
    if (!dom.cognitiveInspectorRuntimeState || !dom.cognitiveInspectorRuntimeRound || !dom.cognitiveInspectorRuntimeSummary || !dom.cognitiveInspectorRuntimeRoles) {
        return;
    }

    if (latestSelectionTrace) {
        renderRuntimeTrace(dom, latestSelectionTrace, buildRoundRoleDebugFromSelectionTrace);
        return;
    }

    renderRuntimePreview(dom, runtimePreview);
}

function countSourceMessages(value) {
    return Array.isArray(value) ? value.filter(Boolean).length : 0;
}

function getRoundSyntheses(activeSession) {
    const syntheses = activeSession?.round_syntheses || activeSession?.roundSyntheses || [];
    return Array.isArray(syntheses) ? syntheses.filter(Boolean) : [];
}

function getLatestRoundSynthesis(activeSession) {
    return getRoundSyntheses(activeSession)
        .slice()
        .sort((a, b) => {
            const roundDelta = Number(b?.round_index || 0) - Number(a?.round_index || 0);
            if (roundDelta) {
                return roundDelta;
            }
            return String(b?.updated_at || b?.created_at || '').localeCompare(String(a?.updated_at || a?.created_at || ''));
        })[0] || null;
}

function getConversationPolicyLabel(conversation_policy) {
    const policy = String(conversation_policy || '').trim().toLowerCase();
    if (policy === 'project' || policy === 'decision') {
        return translateUiText('项目/决策会话');
    }
    if (policy === 'ordinary' || policy === 'casual' || policy === 'chat' || policy === 'general') {
        return translateUiText('普通群聊');
    }
    return conversation_policy ? translateUiText(conversation_policy) : translateUiText('普通群聊');
}

function getConsensusStateLabel(consensus_state) {
    const state = String(consensus_state || '').trim().toLowerCase();
    if (state === 'consensus' || state === 'accepted') {
        return translateUiText('已形成共识');
    }
    if (state === 'consensus_with_caveats') {
        return translateUiText('有保留共识');
    }
    if (state === 'unresolved_split' || state === 'no_consensus') {
        return translateUiText('保留分歧');
    }
    if (state === 'exploratory' || state === 'open') {
        return translateUiText('继续讨论');
    }
    return consensus_state ? translateUiText(consensus_state) : translateUiText('不要求结论');
}

function getParticipationStateLabel(participationState) {
    const state = String(participationState || '').trim().toLowerCase();
    if (state === 'spoke') return translateUiText('已发言');
    if (state === 'listening') return translateUiText('旁听');
    if (state === 'silent') return translateUiText('沉默');
    if (state === 'muted' || state === 'inactive') return translateUiText('暂不参与');
    return participationState ? translateUiText(participationState) : translateUiText('未记录');
}

function getStanceLabel(stance) {
    const value = String(stance || '').trim().toLowerCase();
    if (value === 'adds_context') return translateUiText('补充上下文');
    if (value === 'caution') return translateUiText('风险提醒');
    if (value === 'supports' || value === 'agrees') return translateUiText('支持');
    if (value === 'opposes' || value === 'disagrees') return translateUiText('反对');
    if (value === 'neutral') return translateUiText('中立');
    return stance ? translateUiText(stance) : translateUiText('未标注立场');
}

function appendSynthesisEmpty(container, text) {
    const empty = document.createElement('div');
    empty.className = 'cognitive-synthesis-empty';
    empty.textContent = translateUiText(text);
    container.appendChild(empty);
}

function createSynthesisBadge(text, variant = 'neutral') {
    const badge = document.createElement('span');
    badge.className = `cognitive-synthesis-badge cognitive-synthesis-badge-${variant}`;
    badge.textContent = translateUiText(text);
    return badge;
}

function appendSynthesisMeta(container, metaItems) {
    const meta = document.createElement('div');
    meta.className = 'cognitive-synthesis-meta';
    for (const item of metaItems.filter(Boolean)) {
        meta.appendChild(createSynthesisBadge(item.text, item.variant));
    }
    container.appendChild(meta);
}

function renderSynthesisSummary(container, synthesis) {
    container.innerHTML = '';
    if (!synthesis) {
        appendSynthesisEmpty(container, '暂无群聊状态沉淀。普通聊天保留记忆候选，项目讨论会额外沉淀决策、风险和任务。');
        return;
    }

    const title = document.createElement('div');
    title.className = 'cognitive-synthesis-title';
    const roundIndex = Number(synthesis.round_index || 0);
    title.textContent = [
        roundIndex > 0 ? `第 ${roundIndex} 轮` : translateUiText('最近一轮'),
        getConversationPolicyLabel(synthesis.conversation_policy),
        getConsensusStateLabel(synthesis.consensus_state)
    ].join(' · ');

    const sourceCount = countSourceMessages(synthesis.source_message_ids);
    const participantCount = Array.isArray(synthesis.participant_states) ? synthesis.participant_states.length : 0;
    const memoryCount = Array.isArray(synthesis.memory_deposition?.items) ? synthesis.memory_deposition.items.length : 0;

    container.appendChild(title);
    appendSynthesisMeta(container, [
        { text: `来源 ${sourceCount} 条消息`, variant: 'source' },
        { text: `${participantCount} 位角色状态`, variant: 'participant' },
        { text: `${memoryCount} 条记忆沉淀`, variant: 'memory' }
    ]);
}

function renderParticipantStates(container, synthesis) {
    const participant_states = Array.isArray(synthesis?.participant_states)
        ? synthesis.participant_states.filter(Boolean)
        : [];
    container.innerHTML = '';
    if (!participant_states.length) {
        appendSynthesisEmpty(container, '还没有角色参与状态。');
        return;
    }

    for (const participant of participant_states.slice(0, 8)) {
        const item = document.createElement('div');
        item.className = 'cognitive-synthesis-participant';

        const name = document.createElement('div');
        name.className = 'cognitive-synthesis-participant-name';
        name.textContent = participant.role_name || participant.role_id || translateUiText('未知角色');

        const detail = document.createElement('div');
        detail.className = 'cognitive-synthesis-participant-detail';
        detail.textContent = [
            getParticipationStateLabel(participant.participation_state),
            getStanceLabel(participant.stance),
            translateUiText(`引用 ${countSourceMessages(participant.referenced_message_ids)} 条`)
        ].join(' · ');

        item.appendChild(name);
        item.appendChild(detail);
        container.appendChild(item);
    }

    if (participant_states.length > 8) {
        appendSynthesisEmpty(container, `还有 ${participant_states.length - 8} 位角色状态未展开。`);
    }
}

function renderMemoryDeposition(container, synthesis) {
    const memory_items = Array.isArray(synthesis?.memory_deposition?.items)
        ? synthesis.memory_deposition.items.filter(Boolean)
        : [];
    container.innerHTML = '';
    if (!memory_items.length) {
        appendSynthesisEmpty(container, '还没有本轮记忆沉淀。');
        return;
    }

    for (const item of memory_items.slice(0, 5)) {
        const row = document.createElement('div');
        row.className = 'cognitive-synthesis-item cognitive-synthesis-memory-item';

        const content = document.createElement('div');
        content.className = 'cognitive-synthesis-item-content';
        content.textContent = item.content || item.title || translateUiText('空记忆条目');

        row.appendChild(content);
        appendSynthesisMeta(row, [
            { text: item.type || 'memory', variant: 'memory' },
            { text: item.confirmation_required ? '需确认' : '自动候选', variant: item.confirmation_required ? 'attention' : 'source' },
            { text: `来源 ${countSourceMessages(item.source_message_ids)} 条消息`, variant: 'source' }
        ]);
        container.appendChild(row);
    }

    if (memory_items.length > 5) {
        appendSynthesisEmpty(container, `还有 ${memory_items.length - 5} 条记忆沉淀未展开。`);
    }
}

function appendProjectAssetGroup(container, label, items, variant, getDetail) {
    for (const item of items.slice(0, 4)) {
        const row = document.createElement('div');
        row.className = `cognitive-synthesis-item cognitive-synthesis-project-item cognitive-synthesis-project-${variant}`;

        const content = document.createElement('div');
        content.className = 'cognitive-synthesis-item-content';
        content.textContent = item.title || item.content || translateUiText('未命名项目资产');

        row.appendChild(content);
        appendSynthesisMeta(row, [
            { text: label, variant },
            getDetail?.(item)
        ]);
        container.appendChild(row);
    }
    if (items.length > 4) {
        appendSynthesisEmpty(container, `${label} 还有 ${items.length - 4} 条未展开。`);
    }
}

function buildProjectAssetsHccCommand(synthesisId, scriptName) {
    return `cd apps/backend && npm run ${scriptName} -- --synthesis ${synthesisId}`;
}

function appendProjectAssetsConfirmation(container, synthesis, project_assets, recommendedTasks) {
    const policy = String(synthesis?.conversation_policy || '').trim().toLowerCase();
    const synthesisId = String(synthesis?.id || '').trim();
    const roundIndex = Number(synthesis?.round_index || 0);
    const canConfirm = ['project', 'decision'].includes(policy) && synthesisId && recommendedTasks.length > 0;
    const confirmed = project_assets.confirmed === true;

    if (!canConfirm) {
        return;
    }

    const actions = document.createElement('div');
    actions.className = 'cognitive-synthesis-project-actions';

    const status = document.createElement('div');
    status.className = 'cognitive-synthesis-project-status';
    status.textContent = confirmed
        ? translateUiText(`项目资产已确认，可在宿主机创建 ${recommendedTasks.length} 个 hcc 任务。`)
        : translateUiText(`推荐任务 ${recommendedTasks.length} 个，确认后才会开放 hcc backlog 命令。`);
    actions.appendChild(status);

    if (confirmed) {
        appendSynthesisMeta(actions, [
            { text: '已确认', variant: 'decision' },
            { text: project_assets.confirmed_by ? `确认人 ${project_assets.confirmed_by}` : '确认人 unknown', variant: 'source' }
        ]);

        const dryRunCommand = document.createElement('code');
        dryRunCommand.className = 'cognitive-synthesis-command';
        dryRunCommand.textContent = buildProjectAssetsHccCommand(synthesisId, 'project-assets:hcc:dry-run');
        actions.appendChild(dryRunCommand);

        const createCommand = document.createElement('code');
        createCommand.className = 'cognitive-synthesis-command cognitive-synthesis-command-write';
        createCommand.textContent = buildProjectAssetsHccCommand(synthesisId, 'project-assets:hcc:create');
        actions.appendChild(createCommand);
    } else {
        const confirmButton = document.createElement('button');
        confirmButton.type = 'button';
        confirmButton.className = 'role-action-btn role-action-secondary';
        confirmButton.dataset.projectAssetsAction = 'confirm';
        confirmButton.dataset.projectAssetsRoundIndex = String(roundIndex);
        confirmButton.textContent = translateUiText('确认项目资产');
        actions.appendChild(confirmButton);
    }

    container.appendChild(actions);
}

function renderProjectAssets(container, synthesis) {
    const project_assets = synthesis?.project_assets || {};
    const projectAssets = project_assets;
    const decisions = Array.isArray(projectAssets.decisions) ? projectAssets.decisions.filter(Boolean) : [];
    const risks = Array.isArray(projectAssets.risks) ? projectAssets.risks.filter(Boolean) : [];
    const openQuestions = Array.isArray(projectAssets.open_questions) ? projectAssets.open_questions.filter(Boolean) : [];
    const recommendedTasks = Array.isArray(projectAssets.recommended_tasks) ? projectAssets.recommended_tasks.filter(Boolean) : [];

    container.innerHTML = '';
    if (!decisions.length && !risks.length && !openQuestions.length && !recommendedTasks.length) {
        appendSynthesisEmpty(container, '当前会话没有项目资产沉淀。');
        return;
    }

    appendProjectAssetGroup(container, '决策', decisions, 'decision', item => ({
        text: item.status || 'accepted',
        variant: 'source'
    }));
    appendProjectAssetGroup(container, '风险', risks, 'risk', item => ({
        text: item.severity || 'medium',
        variant: 'attention'
    }));
    appendProjectAssetGroup(container, '问题', openQuestions, 'question', () => ({
        text: '待讨论',
        variant: 'participant'
    }));
    appendProjectAssetGroup(container, '任务', recommendedTasks, 'task', item => ({
        text: item.target_task || '待认领',
        variant: 'source'
    }));
    appendProjectAssetsConfirmation(container, synthesis, project_assets, recommendedTasks);
}

function renderRoundSynthesisPanel({ dom, activeSession }) {
    if (!dom.cognitiveInspectorSynthesisSummary || !dom.cognitiveInspectorParticipantStates || !dom.cognitiveInspectorMemoryDeposition || !dom.cognitiveInspectorProjectAssets) {
        return;
    }

    const synthesis = getLatestRoundSynthesis(activeSession);
    renderSynthesisSummary(dom.cognitiveInspectorSynthesisSummary, synthesis);
    renderParticipantStates(dom.cognitiveInspectorParticipantStates, synthesis);
    renderMemoryDeposition(dom.cognitiveInspectorMemoryDeposition, synthesis);
    renderProjectAssets(dom.cognitiveInspectorProjectAssets, synthesis);
}

function normalizeMemoryTraceList(latestSelectionTrace) {
    const traces = latestSelectionTrace?.memory_traces;
    return Array.isArray(traces) ? traces.filter(Boolean) : [];
}

function formatNotebookList(values, emptyText) {
    const list = Array.isArray(values)
        ? values.map(value => String(value || '').trim()).filter(Boolean)
        : [];
    return list.length ? list.join(' / ') : emptyText;
}

function formatReadPolicy(policy = {}) {
    const parts = [];
    if (policy.allow_private) {
        parts.push('私有');
    }
    if (policy.allow_knowledge) {
        parts.push('知识');
    }
    if (policy.allow_shared) {
        parts.push('共享');
    }
    return parts.length ? parts.join('/') : '无';
}

function formatWritePolicy(policy = {}) {
    const parts = [];
    if (policy.allow_private_write) {
        parts.push('私有');
    }
    if (policy.allow_shared_write) {
        parts.push('共享');
    }
    return parts.length ? parts.join('/') : '无';
}

function renderMemoryTrace(dom, latestSelectionTrace) {
    if (!dom.cognitiveInspectorMemoryTrace) {
        return;
    }

    const traces = normalizeMemoryTraceList(latestSelectionTrace);
    dom.cognitiveInspectorMemoryTrace.innerHTML = '';
    if (!traces.length) {
        const empty = document.createElement('div');
        empty.className = 'cognitive-inspector-empty';
        empty.textContent = '等待角色回合返回核心记忆协议。发送消息后，这里会显示核心层实际开放的记忆读写范围。';
        dom.cognitiveInspectorMemoryTrace.appendChild(empty);
        return;
    }

    for (const trace of traces.slice(0, 6)) {
        const card = document.createElement('div');
        card.className = 'cognitive-memory-trace-card';

        const topLine = document.createElement('div');
        topLine.className = 'cognitive-memory-card-topline';

        const title = document.createElement('div');
        title.className = 'cognitive-memory-card-title';
        title.textContent = trace.role_name || trace.role_id || '未知角色';

        const owner = document.createElement('span');
        owner.className = 'cognitive-memory-owner';
        owner.textContent = trace.storage_owner || translateUiText('核心层');

        topLine.appendChild(title);
        topLine.appendChild(owner);

        const badges = document.createElement('div');
        badges.className = 'cognitive-memory-badges';
        appendMemoryBadges(badges, [
            { text: trace.private_notebook ? translateUiText(`私有 ${trace.private_notebook}`) : translateUiText('无私有记忆'), variant: trace.private_notebook ? 'private' : 'muted' },
            { text: trace.knowledge_notebook ? translateUiText(`知识 ${trace.knowledge_notebook}`) : translateUiText('无知识记忆'), variant: trace.knowledge_notebook ? 'knowledge' : 'muted' },
            { text: translateUiText(`共享 ${formatNotebookList(trace.shared_notebooks, '无')}`), variant: Array.isArray(trace.shared_notebooks) && trace.shared_notebooks.length ? 'shared' : 'muted' }
        ]);

        const policy = document.createElement('div');
        policy.className = 'cognitive-memory-policy-row';
        policy.textContent = translateUiText(`读: ${formatReadPolicy(trace.read_policy)} · 写: ${formatWritePolicy(trace.write_policy)}`);

        card.appendChild(topLine);
        card.appendChild(badges);
        card.appendChild(policy);
        dom.cognitiveInspectorMemoryTrace.appendChild(card);
    }

    if (traces.length > 6) {
        const extra = document.createElement('div');
        extra.className = 'cognitive-memory-more';
        extra.textContent = translateUiText(`还有 ${traces.length - 6} 条记忆协议痕迹未展开。`);
        dom.cognitiveInspectorMemoryTrace.appendChild(extra);
    }
}

function getMemoryCandidateStatusText(candidate) {
    const status = String(candidate?.status || 'pending').trim().toLowerCase();
    if (status === 'confirmed') {
        const coreStatus = normalizeCoreWriteStatus(candidate);
        if (coreStatus === 'written') {
            return translateUiText('已写入核心记忆');
        }
        if (coreStatus === 'write_failed') {
            return translateUiText('核心写入失败');
        }
        return translateUiText('已确认，等待核心写入适配器');
    }
    if (status === 'dismissed') {
        return '已忽略';
    }
    return translateUiText('待确认');
}

function normalizeCoreWriteStatus(candidate) {
    return String(candidate?.core_write_status || '').trim().toLowerCase();
}

function normalizeCoreIndexStatus(candidate) {
    const status = candidate?.core_index_status?.index_status
        || candidate?.core_write_result?.index_check?.index_status
        || candidate?.core_write_result?.index_result?.index_status
        || '';
    return String(status).trim().toLowerCase();
}

function getMemoryCandidateStatusClass(candidate) {
    const status = String(candidate?.status || 'pending').trim().toLowerCase();
    const coreStatus = normalizeCoreWriteStatus(candidate);
    if (status === 'confirmed' && coreStatus === 'written') {
        return 'written';
    }
    if (status === 'confirmed' && coreStatus === 'write_failed') {
        return 'write-failed';
    }
    if (status === 'confirmed' || status === 'dismissed') {
        return status;
    }
    return 'pending';
}

function getMemoryCandidateCoreLine(candidate) {
    const coreStatus = normalizeCoreWriteStatus(candidate);
    if (!coreStatus || coreStatus === 'not_wired' || coreStatus === 'dismissed') {
        return '';
    }

    const result = candidate?.core_write_result || {};
    if (coreStatus === 'written') {
        return result.file_path
            ? translateUiText(`核心写入：${result.file_path}`)
            : translateUiText(`核心写入：${result.adapter || '核心适配器'} 已完成`);
    }
    if (coreStatus === 'write_failed') {
        return translateUiText(`核心写入失败：${summarizeText(result.message || result.error || translateUiText('未知错误'), 120)}`);
    }
    return translateUiText(`核心写入状态：${coreStatus}`);
}

function getMemoryCandidateIndexText(candidate) {
    const indexStatus = normalizeCoreIndexStatus(candidate);
    if (!indexStatus) {
        return '';
    }
    if (indexStatus === 'indexed') {
        return translateUiText('向量索引：已可检索');
    }
    if (indexStatus === 'queued' || indexStatus === 'already_queued') {
        return translateUiText('向量索引：已加入核心队列');
    }
    if (indexStatus === 'pending_vectors') {
        return translateUiText('向量索引：等待向量生成');
    }
    if (indexStatus === 'partial_vectors') {
        return translateUiText('向量索引：部分可检索');
    }
    if (indexStatus === 'not_indexed') {
        return translateUiText('向量索引：未入库');
    }
    if (indexStatus === 'status_failed') {
        const message = candidate?.core_index_status?.error || candidate?.core_write_result?.index_check?.error || translateUiText('未知错误');
        return translateUiText(`向量索引状态获取失败：${summarizeText(message, 100)}`);
    }
    if (indexStatus === 'database_unavailable') {
        return translateUiText('向量索引：核心数据库暂不可用');
    }
    return translateUiText(`向量索引：${indexStatus}`);
}

function getMemoryCandidateIndexBadgeVariant(candidate) {
    const indexStatus = normalizeCoreIndexStatus(candidate);
    if (indexStatus === 'indexed') {
        return 'indexed';
    }
    if (indexStatus === 'queued' || indexStatus === 'already_queued') {
        return 'index-queued';
    }
    if (indexStatus === 'pending_vectors' || indexStatus === 'partial_vectors') {
        return 'index-pending';
    }
    if (indexStatus === 'status_failed' || indexStatus === 'database_unavailable') {
        return 'write-failed';
    }
    return 'muted';
}

function renderMemoryCandidateActions(card, candidate) {
    const status = getMemoryCandidateStatusClass(candidate);
    const candidateId = String(candidate?.id || '').trim();
    const actions = document.createElement('div');
    actions.className = 'cognitive-memory-candidate-actions';

    if (status !== 'pending' || !candidateId) {
        const note = document.createElement('span');
        note.className = 'cognitive-memory-candidate-note';
        note.textContent = translateUiText(getMemoryCandidateStatusText(candidate));
        actions.appendChild(note);
        card.appendChild(actions);
        return;
    }

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'role-action-btn role-action-secondary';
    confirmBtn.dataset.memoryCandidateAction = 'confirm';
    confirmBtn.dataset.memoryCandidateId = candidateId;
    confirmBtn.textContent = translateUiText('确认写入');

    const dismissBtn = document.createElement('button');
    dismissBtn.type = 'button';
    dismissBtn.className = 'role-action-btn role-action-secondary';
    dismissBtn.dataset.memoryCandidateAction = 'dismiss';
    dismissBtn.dataset.memoryCandidateId = candidateId;
    dismissBtn.textContent = translateUiText('忽略');

    actions.appendChild(confirmBtn);
    actions.appendChild(dismissBtn);
    card.appendChild(actions);
}

function renderMemoryCandidates(dom, memoryCandidates) {
    if (!dom.cognitiveInspectorMemoryCandidates) {
        return;
    }

    const candidates = Array.isArray(memoryCandidates) ? memoryCandidates.filter(Boolean) : [];
    dom.cognitiveInspectorMemoryCandidates.innerHTML = '';
    if (!candidates.length) {
        const empty = document.createElement('div');
        empty.className = 'cognitive-inspector-empty';
        empty.textContent = translateUiText('暂无候选记忆。点击“生成反思”后，业务层会根据最近会话生成待确认条目。');
        dom.cognitiveInspectorMemoryCandidates.appendChild(empty);
        return;
    }

    for (const candidate of candidates) {
        const status = getMemoryCandidateStatusClass(candidate);
        const card = document.createElement('div');
        card.className = `cognitive-memory-candidate cognitive-memory-candidate-${status}`;

        const meta = document.createElement('div');
        meta.className = 'cognitive-memory-candidate-meta';

        const target = candidate.target_role_name || candidate.target_role_id || translateUiText(candidate.scope === 'private' ? '角色私有' : '群组共享');
        meta.appendChild(createMemoryBadge(target, candidate.scope === 'private' ? 'private' : 'shared'));
        meta.appendChild(createMemoryBadge(translateUiText(candidate.notebook || '公共'), 'knowledge'));
        meta.appendChild(createMemoryBadge(getMemoryCandidateStatusText(candidate), status));
        const indexText = getMemoryCandidateIndexText(candidate);
        if (indexText) {
            meta.appendChild(createMemoryBadge(indexText.replace(/^Vector index: /, translateUiText('向量索引：')), getMemoryCandidateIndexBadgeVariant(candidate)));
        }

        const content = document.createElement('div');
        content.className = 'cognitive-memory-candidate-content';
        content.textContent = candidate.content || translateUiText('空候选记忆');

        card.appendChild(meta);
        card.appendChild(content);

        if (candidate.reason) {
            const reason = document.createElement('div');
            reason.className = 'cognitive-memory-candidate-reason';
            reason.textContent = translateUiText(`理由：${candidate.reason}`);
            card.appendChild(reason);
        }

        const coreLineText = getMemoryCandidateCoreLine(candidate);
        if (coreLineText) {
            const coreLine = document.createElement('div');
            coreLine.className = 'cognitive-memory-candidate-core';
            coreLine.textContent = coreLineText;
            card.appendChild(coreLine);
        }

        if (indexText) {
            const indexLine = document.createElement('div');
            indexLine.className = 'cognitive-memory-candidate-index';
            indexLine.textContent = indexText;
            card.appendChild(indexLine);
        }

        renderMemoryCandidateActions(card, candidate);
        dom.cognitiveInspectorMemoryCandidates.appendChild(card);
    }
}

function normalizeMemoryIndexRepairState(memoryIndexRepair) {
    return {
        loading: Boolean(memoryIndexRepair?.loading),
        scan: memoryIndexRepair?.scan || null,
        lastAction: memoryIndexRepair?.lastAction || null,
        error: String(memoryIndexRepair?.error || '').trim()
    };
}

function getIndexRepairStatusLabel(status) {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized === 'not_indexed') return translateUiText('未入库');
    if (normalized === 'pending_vectors') return translateUiText('等待向量');
    if (normalized === 'partial_vectors') return translateUiText('部分向量');
    if (normalized === 'stale') return translateUiText('文件已变化');
    if (normalized === 'queued' || normalized === 'already_queued') return translateUiText('已在队列');
    if (normalized === 'indexed') return translateUiText('已可检索');
    return translateUiText(normalized) || translateUiText('未知状态');
}

function getIndexRepairBadgeVariant(status) {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized === 'indexed') return 'indexed';
    if (normalized === 'queued' || normalized === 'already_queued') return 'index-queued';
    if (normalized === 'not_indexed' || normalized === 'pending_vectors' || normalized === 'partial_vectors' || normalized === 'stale') {
        return 'index-pending';
    }
    return 'muted';
}

function formatIndexRepairSize(value) {
    const size = Number(value || 0);
    if (!Number.isFinite(size) || size <= 0) {
        return translateUiText('未知大小');
    }
    if (size < 1024) {
        return `${size} B`;
    }
    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function formatIndexRepairTime(value) {
    const time = Number(value || 0);
    if (!Number.isFinite(time) || time <= 0) {
        return translateUiText('未知时间');
    }
    return new Date(time).toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function renderIndexRepairItem(container, item) {
    const card = document.createElement('div');
    card.className = `cognitive-index-repair-item cognitive-index-repair-item-${String(item?.index_status || 'unknown').replace(/_/g, '-')}`;

    const title = document.createElement('div');
    title.className = 'cognitive-index-repair-path';
    title.textContent = item?.rel_path || item?.file_path || translateUiText('未知记忆文件');

    const meta = document.createElement('div');
    meta.className = 'cognitive-memory-badges';
    appendMemoryBadges(meta, [
        { text: getIndexRepairStatusLabel(item?.index_status), variant: getIndexRepairBadgeVariant(item?.index_status) },
        { text: translateUiText(item?.diary_name) || translateUiText('默认记忆本'), variant: 'knowledge' },
        { text: translateUiText(`向量 ${Number(item?.valid_vector_count || 0)}/${Number(item?.chunk_count || 0)}`), variant: 'muted' }
    ]);

    const detail = document.createElement('div');
    detail.className = 'cognitive-index-repair-detail';
    detail.textContent = translateUiText(`${formatIndexRepairSize(item?.size)} · 更新 ${formatIndexRepairTime(item?.mtime)}`);

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(detail);
    container.appendChild(card);
}

function renderMemoryIndexRepair(dom, memoryIndexRepair) {
    if (!dom.cognitiveInspectorIndexRepairStatus || !dom.cognitiveInspectorIndexRepairList) {
        return;
    }

    const repairState = normalizeMemoryIndexRepairState(memoryIndexRepair);
    const scan = repairState.scan || null;
    const items = Array.isArray(scan?.items) ? scan.items.filter(Boolean) : [];
    const matchedCount = Number(scan?.matched_count ?? items.length ?? 0);
    const scannedCount = Number(scan?.scanned_count ?? 0);
    const lastQueuedCount = Number(repairState.lastAction?.queued_count || 0);

    if (dom.cognitiveInspectorIndexScan) {
        dom.cognitiveInspectorIndexScan.disabled = repairState.loading;
        dom.cognitiveInspectorIndexScan.textContent = translateUiText(repairState.loading ? '扫描中...' : '扫描待补索引');
    }
    for (const button of [dom.cognitiveInspectorIndexRequeueOne, dom.cognitiveInspectorIndexRequeueFive]) {
        if (button) {
            button.disabled = repairState.loading || items.length === 0;
        }
    }

    if (repairState.loading) {
        dom.cognitiveInspectorIndexRepairStatus.textContent = translateUiText('正在请求业务后端代理核心扫描，不会暴露核心密钥。');
    } else if (repairState.error) {
        dom.cognitiveInspectorIndexRepairStatus.textContent = translateUiText(`索引修复检查失败：${summarizeText(repairState.error, 96)}`);
    } else if (scan) {
        dom.cognitiveInspectorIndexRepairStatus.textContent = translateUiText([
            `已扫描 ${scannedCount} 个记忆文件`,
            `命中 ${matchedCount} 个待补索引`,
            repairState.lastAction ? `上次提交 ${lastQueuedCount} 个入队` : ''
        ].filter(Boolean).join(' · '));
    } else {
        dom.cognitiveInspectorIndexRepairStatus.textContent = translateUiText('先扫描，只做 dry-run，不会消耗向量额度；补索引按钮才会提交核心队列。');
    }

    dom.cognitiveInspectorIndexRepairList.innerHTML = '';
    if (repairState.error) {
        const empty = document.createElement('div');
        empty.className = 'cognitive-inspector-empty cognitive-index-repair-empty';
        empty.textContent = '核心索引扫描暂不可用。请确认 VCPToolBox 与 VCPGroupChat 产品后端都已启动。';
        dom.cognitiveInspectorIndexRepairList.appendChild(empty);
        return;
    }
    if (!scan) {
        const empty = document.createElement('div');
        empty.className = 'cognitive-inspector-empty cognitive-index-repair-empty';
        empty.textContent = '还没有扫描结果。建议先点“扫描待补索引”。';
        dom.cognitiveInspectorIndexRepairList.appendChild(empty);
        return;
    }
    if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'cognitive-inspector-empty cognitive-index-repair-empty';
        empty.textContent = '没有发现需要补向量索引的记忆文件。';
        dom.cognitiveInspectorIndexRepairList.appendChild(empty);
        return;
    }

    for (const item of items.slice(0, 6)) {
        renderIndexRepairItem(dom.cognitiveInspectorIndexRepairList, item);
    }
    if (items.length > 6) {
        const extra = document.createElement('div');
        extra.className = 'cognitive-memory-more';
        extra.textContent = `还有 ${items.length - 6} 个候选未展开。`;
        dom.cognitiveInspectorIndexRepairList.appendChild(extra);
    }
}

function renderMemoryInspector({ dom, latestSelectionTrace, memoryReflection, memoryCandidates, memoryIndexRepair }) {
    if (dom.cognitiveInspectorMemorySummary) {
        dom.cognitiveInspectorMemorySummary.textContent = memoryReflection?.summary
            || '还没有会话反思。发送几轮消息后，可以生成候选记忆。';
    }

    renderMemoryTrace(dom, latestSelectionTrace);
    renderMemoryIndexRepair(dom, memoryIndexRepair);
    renderMemoryCandidates(dom, memoryCandidates);
}

function renderMemberChips({ dom, automaticRoles, selectedRoles, sessionProfile, bootstrapData }) {
    if (!dom.cognitiveInspectorMembers) {
        return;
    }

    dom.cognitiveInspectorMembers.innerHTML = '';
    const visibleRoles = buildVisibleInspectorRoles(automaticRoles, selectedRoles);
    if (!visibleRoles.length) {
        dom.cognitiveInspectorMembers.innerHTML = '<div class="cognitive-inspector-empty">当前群组没有默认上场角色。</div>';
        return;
    }

    const selectedRoleIds = new Set(selectedRoles.map(role => role.id));
    const automaticRoleIds = new Set(automaticRoles.map(role => role.id));
    const memberOrder = new Map((sessionProfile?.members || []).map(member => [member.role_id, member.role_order || 9999]));

    for (const role of visibleRoles) {
        const item = document.createElement('div');
        item.className = 'cognitive-member-chip';
        if (selectedRoleIds.has(role.id)) {
            item.classList.add('cognitive-member-chip-selected');
        }

        const topLine = document.createElement('div');
        topLine.className = 'cognitive-member-topline';

        const name = document.createElement('span');
        name.className = 'cognitive-member-name';
        name.textContent = role.name || role.id || translateUiText('未知角色');

        const order = document.createElement('span');
        order.className = 'cognitive-member-order';
        order.textContent = `#${memberOrder.get(role.id) ?? '-'}`;

        topLine.appendChild(name);
        topLine.appendChild(order);

        const description = document.createElement('div');
        description.className = 'cognitive-member-description';
        description.textContent = summarizeText(role.description || role.persona || role.responsibilities, 68) || translateUiText('暂无角色说明');

        const badges = document.createElement('div');
        badges.className = 'cognitive-member-badges';
        const runtimeModelStatus = getRoleRuntimeModelStatus(role, bootstrapData);
        const badgeTexts = [
            role.source === 'ephemeral' ? '临时角色' : '运行时角色',
            selectedRoleIds.has(role.id)
                ? (automaticRoleIds.has(role.id) ? '本轮点名' : '本轮外援')
                : '默认参与',
            formatRoleRuntimeModelBadge(role, bootstrapData),
            runtimeModelStatus.disabled ? '运行时回退' : null,
            resolveRoleMemory(role).length ? '记忆已配置' : '无专属记忆'
        ].filter(Boolean);
        for (const badgeText of badgeTexts) {
            const badge = document.createElement('span');
            badge.className = 'cognitive-member-badge';
            badge.textContent = badgeText;
            badges.appendChild(badge);
        }

        item.appendChild(topLine);
        item.appendChild(description);
        item.appendChild(badges);
        dom.cognitiveInspectorMembers.appendChild(item);
    }
}

export function renderCognitiveInspector(deps) {
    const {
        dom,
        sessionProfile,
        selectedRoles,
        automaticRoles,
        getProfileModeLabel,
        getProfileModeDetail,
        latestSelectionTrace,
        memoryReflection,
        memoryCandidates,
        memoryIndexRepair,
        activeSession,
        bootstrapData,
        runtimePreview,
        buildRoundRoleDebugFromSelectionTrace
    } = deps;

    if (!dom.cognitiveInspectorProfileName) {
        return;
    }

    const enabledMembers = (sessionProfile?.members || []).filter(member => member.enabled !== false);
    const modeLabel = getProfileModeLabel?.(sessionProfile?.mode) || '顺序协作';
    const modeDetail = getProfileModeDetail?.(sessionProfile) || '';
    const sessionCount = Number(sessionProfile?.session_count || 0);

    dom.cognitiveInspectorProfileName.textContent = sessionProfile?.name || translateUiText('未选择群组');
    dom.cognitiveInspectorProfileSummary.textContent = sessionProfile?.description
        || translateUiText('当前会话使用的群组配置会决定默认上场角色、协作模式和群组级 Prompt。');
    dom.cognitiveInspectorMemberCount.textContent = String(enabledMembers.length);
    dom.cognitiveInspectorMode.textContent = modeDetail ? `${modeLabel} · ${modeDetail}` : modeLabel;
    dom.cognitiveInspectorSessionCount.textContent = String(sessionCount);
    dom.cognitiveInspectorCharter.textContent = summarizeText(sessionProfile?.group_prompt, 180)
        || translateUiText('这个群组还没有单独配置群组级 Prompt，创建会话时会使用默认协作规则。');

    renderMemberChips({
        dom,
        automaticRoles,
        selectedRoles,
        sessionProfile,
        bootstrapData
    });
    renderRuntimeInspector({
        dom,
        latestSelectionTrace,
        runtimePreview,
        buildRoundRoleDebugFromSelectionTrace
    });
    renderRoundSynthesisPanel({
        dom,
        activeSession
    });
    renderMemoryInspector({
        dom,
        latestSelectionTrace,
        memoryReflection,
        memoryCandidates,
        memoryIndexRepair
    });
}
