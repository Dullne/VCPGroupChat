export function bindWorkspaceGroupProfileCardSelection(deps) {
    const {
        card,
        profileId,
        setManagedProfile,
        renderAll
    } = deps;

    card.addEventListener('click', event => {
        if (event.target.closest('button')) {
            return;
        }
        setManagedProfile(profileId);
        renderAll();
    });
    card.addEventListener('keydown', event => {
        if (event.target.closest('button')) {
            return;
        }
        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }
        event.preventDefault();
        setManagedProfile(profileId);
        renderAll();
    });
}
