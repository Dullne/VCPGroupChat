import { createWorkspaceGroupProfileCard } from './workspace-renderers-group-profile-card.js';

export function renderWorkspaceGroupProfileList(deps) {
    const {
        getDom,
        getBootstrapData,
        getProfilesForManagerView,
        getManagedProfile,
        getSessionProfile,
        setManagedProfile,
        renderAll,
        startSessionWithManagedProfile,
        duplicateManagedProfile,
        getProfileModeLabel,
        summarizeInline,
        showToast
    } = deps;

    const dom = getDom();
    const bootstrapData = getBootstrapData();
    dom.groupProfileList.innerHTML = '';

    const profiles = getProfilesForManagerView();
    if (!profiles.length) {
        dom.groupProfileList.innerHTML = '<div class="role-empty">当前筛选条件下没有匹配的群聊配置。</div>';
        return;
    }

    const managedProfile = getManagedProfile();
    const sessionProfile = getSessionProfile();

    for (const profile of profiles) {
        dom.groupProfileList.appendChild(createWorkspaceGroupProfileCard({
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
        }));
    }
}
