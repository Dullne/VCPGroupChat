import { buildProfileOptionGroups } from './team-profile-select-options.js';

export function renderEmptyProfileSelect(dom, selectedProfile, setSelectedProfileId) {
    dom.profileSelect.innerHTML = '';
    const option = document.createElement('option');
    option.value = '';
    option.textContent = '无匹配模板';
    dom.profileSelect.appendChild(option);
    setSelectedProfileId(selectedProfile?.id || null);
}

export function renderGroupedProfileOptions(deps) {
    const {
        dom,
        profilesToRender,
        teams,
        formatProfileOptionLabel
    } = deps;

    dom.profileSelect.innerHTML = '';
    const groups = buildProfileOptionGroups({
        profilesToRender,
        teams,
        formatProfileOptionLabel
    });
    for (const group of groups) {
        const optGroup = document.createElement('optgroup');
        optGroup.label = group.label;

        for (const optionData of group.options) {
            const option = document.createElement('option');
            option.value = optionData.value;
            option.textContent = optionData.text;
            optGroup.appendChild(option);
        }

        dom.profileSelect.appendChild(optGroup);
    }
}
