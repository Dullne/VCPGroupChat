export function buildRoundRoleTraceRows(trace) {
    if (!Array.isArray(trace?.rows)) {
        return [];
    }

    return trace.rows
        .map(item => ({
            role: {
                id: item.id,
                name: item.name,
                kind: item.kind
            },
            status: ['selected', 'blocked', 'excluded'].includes(item.status) ? item.status : 'blocked',
            reasons: Array.isArray(item.reasons) ? item.reasons : [],
            role_order: Number(item.role_order || 0),
            execution: String(item.execution || '').trim(),
            execution_error: String(item.execution_error || '').trim()
        }))
        .sort((a, b) => {
            if (a.role_order !== b.role_order) {
                return a.role_order - b.role_order;
            }
            return String(a.role.name || a.role.id).localeCompare(String(b.role.name || b.role.id), 'zh-Hans-CN');
        });
}
