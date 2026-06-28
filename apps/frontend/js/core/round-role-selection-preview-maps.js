export function createRoleReasonMapHelpers() {
    const blockedMap = new Map();
    const selectedMap = new Map();

    const addSelectedReason = (role, reason) => {
        if (!role?.id) {
            return;
        }
        if (!selectedMap.has(role.id)) {
            selectedMap.set(role.id, { role, reasons: new Set() });
        }
        selectedMap.get(role.id).reasons.add(reason);
    };

    const addBlockedReason = (role, reason) => {
        if (!role?.id) {
            return;
        }
        if (!blockedMap.has(role.id)) {
            blockedMap.set(role.id, { role, reasons: new Set() });
        }
        blockedMap.get(role.id).reasons.add(reason);
    };

    return {
        blockedMap,
        selectedMap,
        addSelectedReason,
        addBlockedReason
    };
}
