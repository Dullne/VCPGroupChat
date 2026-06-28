import { buildWorkspaceGroupProfileCardActions } from './workspace-renderers-group-profile-card-actions.js';
import { bindWorkspaceGroupProfileCardSelection } from './workspace-renderers-group-profile-card-select.js';
import { createWorkspaceGroupProfileCardTitleRow } from './workspace-renderers-group-profile-card-title-row.js';
import {
    createWorkspaceGroupProfileCardDescription,
    createWorkspaceGroupProfileCardMemberMeta
} from './workspace-renderers-group-profile-card-content.js';

export function createWorkspaceGroupProfileCard(deps) {
    const {
        profile,
        bootstrapData,
        managedProfile,
        sessionProfile,
        setManagedProfile,
        renderAll,
        startSessionWithManagedProfile,
        duplicateManagedProfile,
        getProfileModeLabel,
        summarizeInline,
        showToast
    } = deps;

    const card = document.createElement('div');
    card.className = 'group-profile-card';
    card.tabIndex = 0;
    if (managedProfile?.id === profile.id) {
        card.classList.add('group-profile-card-active');
    }
    bindWorkspaceGroupProfileCardSelection({
        card,
        profileId: profile.id,
        setManagedProfile,
        renderAll
    });

    const titleRow = createWorkspaceGroupProfileCardTitleRow({
        profile,
        bootstrapData,
        managedProfile,
        sessionProfile,
        getProfileModeLabel
    });
    const description = createWorkspaceGroupProfileCardDescription(profile, summarizeInline);
    const meta = createWorkspaceGroupProfileCardMemberMeta(profile);

    const actions = buildWorkspaceGroupProfileCardActions({
        profile,
        managedProfile,
        setManagedProfile,
        renderAll,
        startSessionWithManagedProfile,
        duplicateManagedProfile,
        showToast
    });

    card.appendChild(titleRow);
    card.appendChild(description);
    card.appendChild(meta);
    card.appendChild(actions);
    return card;
}
