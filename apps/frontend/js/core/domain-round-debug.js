export function getRoundRoleDebugBadgeClass(reason) {
    if (reason === '手动点名') {
        return 'round-role-debug-badge-manual';
    }
    if (reason === '@点名') {
        return 'round-role-debug-badge-mention';
    }
    if (reason === '随机抽样') {
        return 'round-role-debug-badge-random';
    }
    if (reason === '随机补位') {
        return 'round-role-debug-badge-fill';
    }
    if (reason === '已静音') {
        return 'round-role-debug-badge-muted';
    }
    if (reason === '本轮跳过') {
        return 'round-role-debug-badge-skip';
    }
    if (reason === '执行失败') {
        return 'round-role-debug-badge-error';
    }
    if (reason === '已排除') {
        return 'round-role-debug-badge-skip';
    }
    if (reason === '随机未命中' || reason === '点名优先未命中' || reason === '点名超出随机上限') {
        return 'round-role-debug-badge-neutral';
    }
    return 'round-role-debug-badge-neutral';
}
