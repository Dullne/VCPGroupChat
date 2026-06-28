export function readGroupProfileModeOptionsFromForm({ mode, dom, normalizeNatureRandomModeOptions }) {
    const normalizedMode = String(mode || '').trim().toLowerCase();
    if (normalizedMode !== 'naturerandom') {
        return {};
    }
    return normalizeNatureRandomModeOptions({
        mention_mode: dom.groupProfileMentionMode.value,
        random_min_speakers: dom.groupProfileRandomMin.value,
        random_max_speakers: dom.groupProfileRandomMax.value
    });
}

export function applyGroupProfileModeOptionsToForm({ dom, profile, normalizeNatureRandomModeOptions }) {
    const options = normalizeNatureRandomModeOptions(profile?.mode_options || {});
    dom.groupProfileRandomMin.value = String(options.random_min_speakers);
    dom.groupProfileRandomMax.value = String(options.random_max_speakers);
    dom.groupProfileMentionMode.value = options.mention_mode;
}

export function renderGroupProfileModeOptions({ dom, getManagedProfile, applyGroupProfileModeOptionsToForm }) {
    if (!dom.groupProfileNatureRandomOptions || !dom.groupProfileModeSelect) {
        return;
    }
    const mode = String(dom.groupProfileModeSelect.value || 'sequential').trim().toLowerCase();
    dom.groupProfileNatureRandomOptions.classList.toggle('role-form-inline-hidden', mode !== 'naturerandom');
    if (mode === 'naturerandom') {
        applyGroupProfileModeOptionsToForm({ profile: getManagedProfile() });
    }
}
