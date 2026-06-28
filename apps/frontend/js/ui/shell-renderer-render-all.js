import { syncLocalizedDom, translateUiText } from '../core/i18n.js';

export function renderShellAll(deps) {
    const {
        getDom,
        getActiveSession,
        getSelectedProfileId,
        getBootstrapData,
        renderSessionMessages,
        renderRoleManager,
        renderSidebarGroupList,
        updateFloatingRoleWindow,
        getAutomaticParticipantRoles,
        speakingRoleIds = []
    } = deps;

    const dom = getDom();
    const activeSession = getActiveSession();
    const selectedProfileId = getSelectedProfileId();
    renderSessionMessages();
    renderRoleManager();
    renderSidebarGroupList();
    updateFloatingRoleWindow(getAutomaticParticipantRoles(), speakingRoleIds);
    dom.sessionSelect.value = activeSession?.id || '';
    dom.profileSelect.value = selectedProfileId || activeSession?.profile_id || dom.profileSelect.value;

    const bootstrapData = getBootstrapData?.();
    const currentProfileId = selectedProfileId || activeSession?.profile_id || dom.profileSelect.value;
    const currentProfile = (bootstrapData?.profiles || []).find(profile => profile.id === currentProfileId);
    const sessionTitle = activeSession?.title || activeSession?.profile_name || translateUiText('未选择会话');

    if (dom.headerCurrentGroupName) {
        dom.headerCurrentGroupName.textContent = currentProfile?.name || activeSession?.profile_name || translateUiText('未选择群组');
    }
    if (dom.headerCurrentSessionTitle) {
        dom.headerCurrentSessionTitle.textContent = sessionTitle;
    }
    if (dom.headerContextHint) {
        dom.headerContextHint.textContent = translateUiText(activeSession?.id
            ? '左侧切换，右侧查看群组信息'
            : '先从左侧选择群组或发起群聊');
    }

    syncLocalizedDom();
}
