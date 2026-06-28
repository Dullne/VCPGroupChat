export function bindMemoryReflectionEvents(deps) {
    const {
        dom,
        generateSessionReflection,
        confirmMemoryCandidate,
        dismissMemoryCandidate,
        confirmProjectAssets,
        scanMemoryIndexCandidates,
        requeueMemoryIndexBatch
    } = deps;

    dom.cognitiveInspectorMemoryGenerate?.addEventListener('click', async () => {
        await generateSessionReflection();
    });

    dom.cognitiveInspectorIndexScan?.addEventListener('click', async () => {
        await scanMemoryIndexCandidates?.({
            limit: 5,
            max_scan: 120
        });
    });

    dom.cognitiveInspectorIndexRequeueOne?.addEventListener('click', async () => {
        await requeueMemoryIndexBatch?.({
            limit: 1,
            max_scan: 120
        });
    });

    dom.cognitiveInspectorIndexRequeueFive?.addEventListener('click', async () => {
        await requeueMemoryIndexBatch?.({
            limit: 5,
            max_scan: 120
        });
    });

    dom.cognitiveInspectorMemoryCandidates?.addEventListener('click', async event => {
        const button = event.target?.closest?.('[data-memory-candidate-action]');
        if (!button) {
            return;
        }

        const candidateId = button.dataset.memoryCandidateId || '';
        const action = button.dataset.memoryCandidateAction || '';
        if (!candidateId) {
            return;
        }

        button.disabled = true;
        try {
            if (action === 'confirm') {
                await confirmMemoryCandidate(candidateId);
            } else if (action === 'dismiss') {
                await dismissMemoryCandidate(candidateId);
            }
        } finally {
            button.disabled = false;
        }
    });

    dom.cognitiveInspectorProjectAssets?.addEventListener('click', async event => {
        const button = event.target?.closest?.('[data-project-assets-action]');
        if (!button) {
            return;
        }

        const action = button.dataset.projectAssetsAction || '';
        const roundIndex = button.dataset.projectAssetsRoundIndex || '';
        if (action !== 'confirm' || roundIndex === '') {
            return;
        }

        button.disabled = true;
        try {
            await confirmProjectAssets?.(roundIndex);
        } finally {
            button.disabled = false;
        }
    });
}
