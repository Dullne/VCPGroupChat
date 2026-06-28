export function buildRolePanelHtml(state) {
    const roles = state.availableRoles || [];
    const selectedIds = state.selectedIncludeRoleIds;
    const count = selectedIds.size;
    const total = roles.length;

    const summary = count === 0
        ? '未选择角色'
        : count === total
            ? `全部 ${total} 个角色`
            : `已选 ${count}/${total} 个角色`;

    return `
        <div class="cognitive-inspector-hero">
            <div class="cognitive-inspector-kicker">Cognitive Inspector</div>
            <div id="cognitive-inspector-profile-name" class="cognitive-inspector-title">当前群组</div>
            <div id="cognitive-inspector-profile-summary" class="cognitive-inspector-summary">正在读取群组认知状态。</div>
        </div>
        <div class="cognitive-inspector-stats" aria-label="当前群聊认知状态">
            <div class="cognitive-inspector-stat">
                <span class="cognitive-inspector-stat-label">成员</span>
                <strong id="cognitive-inspector-member-count">${total}</strong>
            </div>
            <div class="cognitive-inspector-stat">
                <span class="cognitive-inspector-stat-label">模式</span>
                <strong id="cognitive-inspector-mode">顺序协作</strong>
            </div>
            <div class="cognitive-inspector-stat">
                <span class="cognitive-inspector-stat-label">会话</span>
                <strong id="cognitive-inspector-session-count">0</strong>
            </div>
        </div>
        <div class="cognitive-inspector-section">
            <div class="cognitive-inspector-section-title">群组章程</div>
            <div id="cognitive-inspector-charter" class="cognitive-inspector-charter">暂无群组章程。</div>
        </div>
        <div class="cognitive-inspector-section">
            <div class="cognitive-inspector-section-title">在场角色</div>
            <div id="cognitive-inspector-members" class="cognitive-inspector-members"></div>
        </div>
        <div class="cognitive-inspector-section">
            <div class="cognitive-inspector-section-title">最近一轮运行</div>
            <div id="cognitive-inspector-runtime" class="cognitive-inspector-runtime" aria-live="polite">
                <div class="cognitive-inspector-runtime-meta">
                    <span id="cognitive-inspector-runtime-state" class="cognitive-runtime-pill cognitive-runtime-pill-preview">前端预测</span>
                    <span id="cognitive-inspector-runtime-round">等待首轮消息</span>
                </div>
                <div id="cognitive-inspector-runtime-summary" class="cognitive-inspector-runtime-summary">发送消息后，这里会显示后端真实选择、成功发言和失败角色。</div>
                <div id="cognitive-inspector-runtime-roles" class="cognitive-inspector-runtime-roles"></div>
            </div>
        </div>
        <div class="cognitive-inspector-section cognitive-inspector-memory-section">
            <div class="cognitive-inspector-section-title-row">
                <div class="cognitive-inspector-section-title">记忆与反思</div>
                <button id="cognitive-inspector-memory-generate" type="button" class="role-action-btn role-action-secondary">生成反思</button>
            </div>
            <div id="cognitive-inspector-memory-summary" class="cognitive-memory-summary">还没有会话反思。发送几轮消息后，可以生成候选记忆。</div>
            <div class="cognitive-index-repair-panel" aria-label="向量索引修复">
                <div class="cognitive-index-repair-copy">
                    <strong>向量索引修复</strong>
                    <span id="cognitive-inspector-index-repair-status">先扫描，只做 dry-run，不会消耗向量额度。</span>
                </div>
                <div class="cognitive-index-repair-actions">
                    <button id="cognitive-inspector-index-scan" type="button" class="role-action-btn role-action-secondary">扫描待补索引</button>
                    <button id="cognitive-inspector-index-requeue-one" type="button" class="role-action-btn role-action-secondary" disabled>补 1 条（会消耗向量额度）</button>
                    <button id="cognitive-inspector-index-requeue-five" type="button" class="role-action-btn role-action-secondary" disabled>补 5 条（会消耗向量额度）</button>
                </div>
                <div id="cognitive-inspector-index-repair-list" class="cognitive-index-repair-list"></div>
            </div>
            <div id="cognitive-inspector-memory-trace" class="cognitive-memory-trace"></div>
            <div id="cognitive-inspector-memory-candidates" class="cognitive-memory-candidates"></div>
        </div>
        <div class="round-role-panel-header cognitive-inspector-section">
            <div class="round-role-panel-copy">
                <div class="round-role-panel-title">本轮发言策略</div>
                <div id="round-role-summary" class="round-role-summary">${summary}</div>
            </div>
            <div class="round-role-panel-actions">
                <button id="toggle-role-selection-btn" type="button" class="role-action-btn role-action-secondary">
                    ${state.roleSelectionExpanded ? '收起' : '展开'}
                </button>
                <button id="clear-role-selection-btn" type="button" class="role-action-btn role-action-secondary">清空</button>
            </div>
        </div>
        <div id="role-selection-list-wrap" class="round-role-selection-wrap ${state.roleSelectionExpanded ? '' : 'round-role-selection-collapsed'}">
            <div id="role-selection-list" class="role-selection-list">
                ${roles.map(role => `
                    <div class="role-selection-item">
                        <input type="checkbox"
                            data-role-id="${role.id}"
                            ${selectedIds.has(role.id) ? 'checked' : ''}>
                        <span class="role-selection-item-name">${role.name}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        <div id="round-role-debug" class="round-role-debug">
            <div class="round-role-debug-header">
                <div class="round-role-debug-title">策略预览</div>
                <div id="round-role-debug-meta" class="round-role-debug-meta"></div>
            </div>
            <div id="round-role-debug-list" class="round-role-debug-list"></div>
        </div>
    `;
}
