import { toggleLocale } from './i18n.js';

export function bindShellUiEvents(deps) {
    const {
        dom,
        applyDarkMode,
        openWorkspace,
        toggleRoleManager,
        renderAll
    } = deps;

    dom.darkModeToggle.addEventListener('click', () => {
        applyDarkMode(!document.body.classList.contains('night-mode'));
    });

    dom.languageToggle?.addEventListener('click', () => {
        toggleLocale({ sync: false });
        renderAll?.();
    });

    dom.launchGroupToggle?.addEventListener('click', async () => {
        await openWorkspace('launcher');
    });

    dom.mobileLaunchGroupToggle?.addEventListener('click', async () => {
        await openWorkspace('launcher');
    });

    dom.sidebarCreateGroupBtn?.addEventListener('click', async () => {
        await openWorkspace('launcher');
    });

    dom.teamManagerToggle.addEventListener('click', async () => {
        await openWorkspace('team');
    });

    dom.roleStudioToggle.addEventListener('click', async () => {
        await openWorkspace('studio');
    });

    dom.roleLibraryToggle.addEventListener('click', async () => {
        await openWorkspace('library');
    });

    dom.roleManagerModal?.addEventListener('click', async event => {
        const button = event.target?.closest?.('[data-workspace-mode-toggle]');
        if (!button || !dom.roleManagerModal.contains(button)) {
            return;
        }
        const mode = button.dataset.workspaceModeToggle;
        if (!mode) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        await openWorkspace(mode);
    });

    dom.roleManagerClose.addEventListener('click', () => {
        toggleRoleManager(false);
    });

    dom.roleManagerModal.addEventListener('click', event => {
        if (event.target === dom.roleManagerModal) {
            toggleRoleManager(false);
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && dom.roleManagerModal.classList.contains('role-manager-open')) {
            toggleRoleManager(false);
        }
    });
}
