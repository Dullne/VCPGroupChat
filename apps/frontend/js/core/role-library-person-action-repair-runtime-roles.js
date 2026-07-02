export function createRepairPersonRuntimeRolesAction(deps) {
    const {
        fetchJson,
        showToast,
        refreshBootstrap,
        renderAll
    } = deps;

    return async function repairMissingRuntimeRoles(personIds = []) {
        const normalizedPersonIds = Array.isArray(personIds)
            ? personIds.map(personId => String(personId || '').trim()).filter(Boolean)
            : [];
        const result = await fetchJson('/api/person-runtime-roles/repair', {
            method: 'POST',
            timeoutSeconds: 240,
            body: normalizedPersonIds.length
                ? { person_ids: normalizedPersonIds }
                : {}
        });

        const repairedCount = Array.isArray(result?.repaired) ? result.repaired.length : 0;
        const failedCount = Array.isArray(result?.failed) ? result.failed.length : 0;
        if (failedCount) {
            showToast(`已生成 ${repairedCount} 个运行时角色，${failedCount} 个失败`, 'warning');
        } else if (repairedCount) {
            showToast(`已生成 ${repairedCount} 个运行时角色`, 'success');
        } else {
            showToast('没有需要修复的运行时角色', 'info');
        }

        await refreshBootstrap();
        renderAll();
        return result;
    };
}
