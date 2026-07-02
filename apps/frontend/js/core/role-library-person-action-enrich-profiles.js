export function createEnrichSparsePersonProfilesAction(deps) {
    const {
        fetchJson,
        showToast,
        refreshBootstrap,
        renderAll
    } = deps;

    return async function enrichSparseProfiles(personIds = []) {
        const normalizedPersonIds = Array.isArray(personIds)
            ? personIds.map(personId => String(personId || '').trim()).filter(Boolean)
            : [];
        const result = await fetchJson('/api/person-profiles/enrich', {
            method: 'POST',
            timeoutSeconds: 240,
            body: {
                ...(normalizedPersonIds.length ? { person_ids: normalizedPersonIds } : {}),
                sync_runtime: true
            }
        });

        const enrichedCount = Array.isArray(result?.enriched) ? result.enriched.length : 0;
        const failedCount = Array.isArray(result?.failed) ? result.failed.length : 0;
        if (failedCount) {
            showToast(`已补全 ${enrichedCount} 个人物档案，${failedCount} 个失败`, 'warning');
        } else if (enrichedCount) {
            showToast(`已补全 ${enrichedCount} 个人物档案`, 'success');
        } else {
            showToast('没有需要补全的人物档案', 'info');
        }

        await refreshBootstrap();
        renderAll();
        return result;
    };
}
