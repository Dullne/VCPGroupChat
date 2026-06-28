import { buildRoleLibrarySessionRoleCardBlocks } from './role-library-runtime-session-role-card-helpers.js';

export function createRoleLibrarySessionRoleCard(deps) {
    const {
        role,
        isRoleInManagedTeam,
        isRoleInManagedProfile,
        getManagedProfileMemberPosition,
        getManagedProfileEnabledMemberCount,
        removeRoleFromGroup,
        addRoleToGroup,
        moveRoleInManagedProfile,
        promoteEphemeralRole,
        deleteEphemeralRole,
        getRoleRuntimeModel,
        getRuntimeModelCandidates,
        onApplyRoleRuntimeModel,
        showToast
    } = deps;

    const card = document.createElement('div');
    card.className = 'role-card';
    card.dataset.roleSource = role.source || 'core';
    card.classList.toggle('role-card-in-team', isRoleInManagedTeam?.(role.id));
    card.classList.toggle('role-card-in-group', isRoleInManagedProfile?.(role.id));

    const {
        titleRow,
        description,
        runtimeMeta,
        detailLoader,
        actions,
        runtimeEditor
    } = buildRoleLibrarySessionRoleCardBlocks(deps);

    card.appendChild(titleRow);
    card.appendChild(description);
    card.appendChild(runtimeMeta);
    if (detailLoader) {
        card.appendChild(detailLoader);
    }
    if (runtimeEditor) {
        card.appendChild(runtimeEditor);
    }
    if (actions.childElementCount > 0) {
        card.appendChild(actions);
    }

    return card;
}
