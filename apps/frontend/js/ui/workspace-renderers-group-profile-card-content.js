import { buildWorkspaceGroupProfileMemberMeta } from './workspace-renderers-group-profile-card-meta.js';
import { translateUiText } from '../core/i18n.js';

export function createWorkspaceGroupProfileCardDescription(profile, summarizeInline) {
    const description = document.createElement('div');
    description.className = 'role-card-description';
    description.textContent = profile.description || summarizeInline(profile.group_prompt || translateUiText('暂无群组说明'), 160);
    return description;
}

export function createWorkspaceGroupProfileCardMemberMeta(profile) {
    const meta = document.createElement('div');
    meta.className = 'profile-summary-meta';
    meta.textContent = buildWorkspaceGroupProfileMemberMeta(profile);
    return meta;
}
