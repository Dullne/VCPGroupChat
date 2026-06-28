export function createMessageResponseHandler(deps) {
    const {
        getDom,
        getActiveSession,
        setActiveSession,
        renderProfileSelectOptions,
        setLatestSelectionTrace,
        refreshSessionsList,
        reloadActiveSessionAndRoles,
        clearExcludedRoleNamesForNextRound,
        clearSelectedIncludeRoleIds,
        renderAll,
        scrollToBottom,
        adjustTextareaHeight,
        showToast
    } = deps;

    async function handleSendMessageSuccess(response, { clearSelectedImage, skipComposerReset = false } = {}) {
        const dom = getDom();
        setActiveSession(response.session);
        setLatestSelectionTrace(
            response.selection_trace && typeof response.selection_trace === 'object'
                ? response.selection_trace
                : null
        );
        await refreshSessionsList();
        await reloadActiveSessionAndRoles();

        const nextSession = getActiveSession();
        renderProfileSelectOptions(nextSession?.profile_id);
        dom.sessionSelect.value = nextSession.id;

        if (!skipComposerReset) {
            dom.messageInput.value = '';
            adjustTextareaHeight(dom.messageInput);
        }
        if (typeof clearSelectedImage === 'function') {
            clearSelectedImage();
        }
        clearExcludedRoleNamesForNextRound();
        clearSelectedIncludeRoleIds();

        const speakingRoleIds = Array.isArray(response.selection_trace?.success_role_ids)
            ? response.selection_trace.success_role_ids
            : (response.assistant_messages || [])
                .map(message => message.speaker_id)
                .filter(Boolean);
        renderAll(speakingRoleIds.length > 0
            ? speakingRoleIds
            : (response.target_roles || []).map(role => role.id));
        scrollToBottom(dom.chatMessages);

        const failedRoles = Array.isArray(response.failed_roles) ? response.failed_roles : [];
        if (failedRoles.length > 0) {
            const preview = failedRoles.slice(0, 2).map(role => role.name || role.id).join('、');
            const suffix = failedRoles.length > 2 ? ` 等 ${failedRoles.length} 位角色` : '';
            const firstError = String(failedRoles[0]?.error || '').trim();
            showToast(`部分角色执行失败：${preview}${suffix}${firstError ? `（${firstError}）` : ''}`, 'warning');
        }
    }

    return {
        handleSendMessageSuccess
    };
}
