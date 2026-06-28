export function createTeamProfileFormStateHelpers(deps) {
    const { getDom } = deps;

    function getGroupProfileFormLoadedProfileId() {
        return getDom()?.groupProfileForm?.dataset?.loadedProfileId || '';
    }

    function setGroupProfileFormLoadedProfileId(profileId) {
        const dom = getDom();
        if (!dom?.groupProfileForm) {
            return;
        }
        dom.groupProfileForm.dataset.loadedProfileId = profileId || '';
    }

    return {
        getGroupProfileFormLoadedProfileId,
        setGroupProfileFormLoadedProfileId
    };
}
