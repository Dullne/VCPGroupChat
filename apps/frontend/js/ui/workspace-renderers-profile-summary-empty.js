export function applyWorkspaceProfileSummaryEmptyState(dom) {
    dom.currentProfileSummary.textContent = '当前没有选中的群聊配置。';
    dom.loadGroupProfileBtn.disabled = true;
    dom.duplicateGroupProfileBtn.disabled = true;
    dom.startSessionWithProfileBtn.disabled = true;
    dom.saveGroupProfileBtn.disabled = true;
    dom.deleteGroupProfileBtn.disabled = true;
}
