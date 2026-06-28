function appendProfileSummaryMetaLine(dom, text) {
    const line = document.createElement('div');
    line.className = 'profile-summary-meta';
    line.textContent = text;
    dom.currentProfileSummary.appendChild(line);
}

export function renderWorkspaceProfileSummaryDetails(deps) {
    const {
        dom,
        profile,
        bootstrapData,
        getTeamById,
        summarizeInline,
        getProfileModeDetail,
        getProfileModeLabel,
        getSessionProfile,
        formatDateTime
    } = deps;

    const enabledMembers = (profile.members || []).filter(member => member.enabled);
    const memberNames = enabledMembers.map(member => member.role_name || member.role_id);
    dom.currentProfileSummary.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'profile-summary-title';
    title.textContent = `${profile.name} · ${enabledMembers.length} 名成员`;
    dom.currentProfileSummary.appendChild(title);

    const description = document.createElement('div');
    description.className = 'profile-summary-description';
    description.textContent = profile.description || '暂无群组说明';
    dom.currentProfileSummary.appendChild(description);

    const team = getTeamById(profile.team_id);
    appendProfileSummaryMetaLine(dom, `所属团队：${team?.name || profile.team_id || '未归属'}`);
    appendProfileSummaryMetaLine(dom, memberNames.length ? `成员：${memberNames.join('、')}` : '当前没有启用成员');

    const modeDetail = getProfileModeDetail(profile);
    appendProfileSummaryMetaLine(
        dom,
        `群聊模式：${getProfileModeLabel(profile.mode)}${modeDetail ? ` · ${modeDetail}` : ''}${profile.invite_prompt ? ' · 邀请提示已配置' : ''}`
    );
    appendProfileSummaryMetaLine(dom, `群组提示：${summarizeInline(profile.group_prompt || '未设置')}`);

    const sessionProfile = getSessionProfile();
    appendProfileSummaryMetaLine(
        dom,
        sessionProfile?.id === profile.id
            ? '当前会话正在使用这套群聊配置'
            : `当前会话使用：${sessionProfile?.name || '无活跃会话'}，这里管理的是：${profile.name}`
    );
    appendProfileSummaryMetaLine(
        dom,
        profile.id === bootstrapData?.default_profile_id
            ? '模板状态：默认模板，受保护'
            : `模板状态：${Number(profile.session_count || 0)} 个会话引用${profile.latest_session_updated_at ? `，最近更新 ${formatDateTime(profile.latest_session_updated_at)}` : ''}`
    );

    dom.deleteGroupProfileBtn.disabled =
        profile.id === bootstrapData?.default_profile_id ||
        Number(profile.session_count || 0) > 0;
    dom.loadGroupProfileBtn.disabled = false;
    dom.duplicateGroupProfileBtn.disabled = false;
    dom.startSessionWithProfileBtn.disabled = false;
    dom.saveGroupProfileBtn.disabled = false;
}
