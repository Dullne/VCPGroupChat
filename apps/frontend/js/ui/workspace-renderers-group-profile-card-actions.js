import { createAsyncActionButton } from './role-card-ui.js';

export function buildWorkspaceGroupProfileCardActions(deps) {
    const {
        profile,
        managedProfile,
        setManagedProfile,
        renderAll,
        startSessionWithManagedProfile,
        duplicateManagedProfile,
        showToast
    } = deps;

    const actions = document.createElement('div');
    actions.className = 'role-card-actions';

    const manageBtn = createAsyncActionButton({
        label: managedProfile?.id === profile.id ? '正在管理' : '管理此模板',
        handler: async () => {
            setManagedProfile(profile.id);
            renderAll();
        },
        variant: managedProfile?.id === profile.id ? 'secondary' : 'primary',
        showToast
    });
    manageBtn.disabled = managedProfile?.id === profile.id;

    actions.appendChild(manageBtn);
    actions.appendChild(createAsyncActionButton({
        label: '开新会话',
        handler: async () => {
            await startSessionWithManagedProfile(profile.id);
        },
        variant: 'secondary',
        showToast
    }));
    actions.appendChild(createAsyncActionButton({
        label: '复制模板',
        handler: async () => {
            await duplicateManagedProfile(profile.id);
        },
        variant: 'secondary',
        showToast
    }));

    return actions;
}
