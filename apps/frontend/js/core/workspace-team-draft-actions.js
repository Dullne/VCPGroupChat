function getEnabledDefaultTeamRoleIds(bootstrapData) {
    const defaultTeamId = bootstrapData?.default_team_id;
    const members = defaultTeamId
        ? bootstrapData?.team_person_members_by_team_id?.[defaultTeamId] || []
        : [];
    return [...new Set(members
        .filter(member => member?.enabled !== false)
        .map(member => String(member?.legacy_role_id || member?.person?.legacy_role_id || '').trim())
        .filter(Boolean))];
}

export function createWorkspaceTeamDraftActions(deps) {
    const {
        getDom,
        getBootstrapData,
        getTeamDraftMode,
        setTeamDraftMode,
        getTeamDraftSelectedRoleIds,
        setTeamDraftSelectedRoleIds,
        clearTeamDraftSelectedRoleIds,
        renderAll,
        showToast
    } = deps;

    function resetTeamForm() {
        const dom = getDom();
        dom.teamForm?.reset();
    }

    function startTeamDraft() {
        setTeamDraftMode(true);
        clearTeamDraftSelectedRoleIds();
        resetTeamForm();
        renderAll();
        getDom().teamForm?.querySelector('#team-name')?.focus();
    }

    function copyDefaultTeamMembersToDraft() {
        const roleIds = getEnabledDefaultTeamRoleIds(getBootstrapData());
        if (!roleIds.length) {
            showToast('默认团队暂时没有可复制人物', 'warning');
            return;
        }

        if (!getTeamDraftMode()) {
            setTeamDraftMode(true);
            resetTeamForm();
        }

        const next = new Set(getTeamDraftSelectedRoleIds());
        for (const roleId of roleIds) {
            next.add(roleId);
        }
        setTeamDraftSelectedRoleIds(next);
        renderAll();
        showToast(`已从默认团队复制 ${roleIds.length} 个人物到草稿`, 'success');
    }

    return {
        startTeamDraft,
        copyDefaultTeamMembersToDraft
    };
}
