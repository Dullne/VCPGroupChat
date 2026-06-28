export function createBootstrapWorkspaceActions(deps) {
    const {
        setWorkspaceMode,
        toggleRoleManager,
        refreshImportSources,
        refreshRoleStudioSources,
        reloadActiveSessionAndRoles,
        renderRoleManager
    } = deps;

    async function openWorkspace(mode) {
        setWorkspaceMode(mode);
        toggleRoleManager(true);
        // Modes with an async data refresh below would otherwise only switch the
        // visible workspace view after the network round-trip completes (the mode
        // class is applied by renderRoleManager). Render once up front so the view
        // switches instantly; the refresh then re-renders to populate fresh data.
        const hasAsyncRefresh =
            mode === 'library' || (mode === 'studio' && typeof refreshRoleStudioSources === 'function');
        if (hasAsyncRefresh) {
            try {
                renderRoleManager();
            } catch (error) {
                console.error(error);
            }
        }
        if (mode === 'library') {
            try {
                const libraryRefreshTasks = [refreshImportSources];
                if (typeof reloadActiveSessionAndRoles === 'function') {
                    libraryRefreshTasks.push(reloadActiveSessionAndRoles);
                }
                await Promise.all(libraryRefreshTasks.map(task => task()));
            } catch (error) {
                console.error(error);
            }
        }
        if (mode === 'studio' && typeof refreshRoleStudioSources === 'function') {
            try {
                await refreshRoleStudioSources();
            } catch (error) {
                console.error(error);
            }
        }
        try {
            renderRoleManager();
        } catch (error) {
            console.error(error);
        }
        if (mode === 'launcher') {
            const startSessionCheckbox = document.getElementById('group-profile-start-session');
            if (startSessionCheckbox) {
                startSessionCheckbox.checked = true;
            }
            requestAnimationFrame(() => {
                document.getElementById('launcher-role-search')?.focus();
            });
        }
    }

    return {
        openWorkspace
    };
}
