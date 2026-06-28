export function createMemoryReflectionActions(deps) {
    const {
        getActiveSession,
        setActiveSession,
        fetchJson,
        setMemoryReflection,
        setMemoryCandidates,
        getMemoryIndexRepair,
        setMemoryIndexRepair,
        renderAll,
        renderRoleSelectionSummary,
        showToast
    } = deps;

    function applyMemoryPayload(payload = {}) {
        setMemoryReflection?.(payload.reflection || null);
        setMemoryCandidates?.(Array.isArray(payload.memory_candidates) ? payload.memory_candidates : []);
    }

    function renderMemoryUi() {
        renderAll?.();
        renderRoleSelectionSummary?.();
    }

    function requireActiveSession() {
        const activeSession = getActiveSession();
        if (!activeSession?.id) {
            showToast('请先创建或选择一个会话。', 'warning');
            return null;
        }
        return activeSession;
    }

    async function refreshSessionReflection() {
        const activeSession = requireActiveSession();
        if (!activeSession) {
            return null;
        }
        const payload = await fetchJson(`/api/group-chat/sessions/${encodeURIComponent(activeSession.id)}/reflection`);
        applyMemoryPayload(payload);
        renderMemoryUi();
        return payload;
    }

    async function generateSessionReflection() {
        const activeSession = requireActiveSession();
        if (!activeSession) {
            return null;
        }
        try {
            const payload = await fetchJson(`/api/group-chat/sessions/${encodeURIComponent(activeSession.id)}/reflection`, {
                method: 'POST',
                body: {}
            });
            applyMemoryPayload(payload);
            renderMemoryUi();
            showToast('已生成会话反思和候选记忆。', 'success');
            return payload;
        } catch (error) {
            showToast(`生成反思失败：${error.message}`, 'danger');
            throw error;
        }
    }

    async function updateMemoryCandidate(candidateId, action) {
        const activeSession = requireActiveSession();
        const normalizedCandidateId = String(candidateId || '').trim();
        if (!activeSession || !normalizedCandidateId) {
            return null;
        }
        try {
            const payload = await fetchJson(
                `/api/group-chat/sessions/${encodeURIComponent(activeSession.id)}/memory-candidates/${encodeURIComponent(normalizedCandidateId)}/${action}`,
                {
                    method: 'POST',
                    body: {}
                }
            );
            applyMemoryPayload(payload);
            renderMemoryUi();
            showToast(action === 'confirm' ? '已确认候选记忆。' : '已忽略候选记忆。', 'success');
            return payload;
        } catch (error) {
            showToast(`更新候选记忆失败：${error.message}`, 'danger');
            throw error;
        }
    }

    function getIndexRepairState() {
        return getMemoryIndexRepair?.() || {
            loading: false,
            scan: null,
            lastAction: null,
            error: ''
        };
    }

    function setIndexRepairState(patch = {}) {
        setMemoryIndexRepair?.({
            ...getIndexRepairState(),
            ...patch
        });
    }

    function buildIndexRepairSearchParams(options = {}) {
        const params = new URLSearchParams();
        params.set('limit', String(options.limit || 5));
        params.set('max_scan', String(options.max_scan || options.maxScan || 120));
        if (options.notebook) {
            params.set('notebook', options.notebook);
        }
        if (options.statuses) {
            params.set('statuses', Array.isArray(options.statuses) ? options.statuses.join(',') : String(options.statuses));
        }
        if (options.include_indexed || options.includeIndexed) {
            params.set('include_indexed', 'true');
        }
        return params;
    }

    async function scanMemoryIndexCandidates(options = {}) {
        setIndexRepairState({
            loading: true,
            error: ''
        });
        renderMemoryUi();

        try {
            const params = buildIndexRepairSearchParams(options);
            const payload = await fetchJson(`/api/group-chat/memory-index/requeue-candidates?${params.toString()}`);
            const matchedCount = Number(payload?.matched_count ?? payload?.items?.length ?? 0);
            setIndexRepairState({
                loading: false,
                scan: payload,
                lastAction: options.keepLastAction ? getIndexRepairState().lastAction : null,
                error: ''
            });
            renderMemoryUi();
            if (!options.silent) {
                showToast(`扫描完成：发现 ${matchedCount} 条待补索引。`, matchedCount > 0 ? 'success' : 'info');
            }
            return payload;
        } catch (error) {
            setIndexRepairState({
                loading: false,
                error: error.message
            });
            renderMemoryUi();
            showToast(`扫描索引候选失败：${error.message}`, 'danger');
            throw error;
        }
    }

    async function requeueMemoryIndexBatch(options = {}) {
        const limit = Number(options.limit || 1);
        const maxScan = Number(options.max_scan || options.maxScan || 120);
        setIndexRepairState({
            loading: true,
            error: ''
        });
        renderMemoryUi();

        try {
            const payload = await fetchJson('/api/group-chat/memory-index/requeue-batch', {
                method: 'POST',
                body: {
                    limit,
                    max_scan: maxScan,
                    dry_run: false
                }
            });
            const queuedCount = Number(payload?.queued_count || 0);
            setIndexRepairState({
                loading: false,
                scan: payload,
                lastAction: payload,
                error: ''
            });
            renderMemoryUi();
            showToast(`已提交 ${queuedCount} 条记忆进入核心向量索引队列。`, queuedCount > 0 ? 'success' : 'warning');

            const activeSession = getActiveSession?.();
            if (activeSession?.id) {
                await refreshSessionReflection().catch(() => null);
            }
            await scanMemoryIndexCandidates({
                limit: Math.max(5, limit),
                max_scan: maxScan,
                silent: true,
                keepLastAction: true
            }).catch(() => null);
            return payload;
        } catch (error) {
            setIndexRepairState({
                loading: false,
                error: error.message
            });
            renderMemoryUi();
            showToast(`补索引失败：${error.message}`, 'danger');
            throw error;
        }
    }

    async function confirmProjectAssets(roundIndex) {
        const activeSession = requireActiveSession();
        const normalizedRoundIndex = Number(roundIndex);
        if (!activeSession || !Number.isInteger(normalizedRoundIndex) || normalizedRoundIndex < 0) {
            showToast('缺少可确认的项目资产轮次。', 'warning');
            return null;
        }

        try {
            const payload = await fetchJson(
                `/api/group-chat/sessions/${encodeURIComponent(activeSession.id)}/round-syntheses/${encodeURIComponent(String(normalizedRoundIndex))}/project-assets/hcc/confirm`,
                {
                    method: 'POST',
                    body: {}
                }
            );
            if (Array.isArray(payload.round_syntheses)) {
                setActiveSession?.({
                    ...activeSession,
                    round_syntheses: payload.round_syntheses
                });
            }
            renderMemoryUi();
            const command = payload?.hcc_bridge?.create_command || '';
            showToast(
                command
                    ? '已确认项目资产；请在宿主机审阅 dry-run 后运行 hcc 创建命令。'
                    : '已确认项目资产。',
                'success'
            );
            return payload;
        } catch (error) {
            showToast(`确认项目资产失败：${error.message}`, 'danger');
            throw error;
        }
    }

    return {
        refreshSessionReflection,
        generateSessionReflection,
        confirmMemoryCandidate: candidateId => updateMemoryCandidate(candidateId, 'confirm'),
        dismissMemoryCandidate: candidateId => updateMemoryCandidate(candidateId, 'dismiss'),
        confirmProjectAssets,
        scanMemoryIndexCandidates,
        requeueMemoryIndexBatch
    };
}
