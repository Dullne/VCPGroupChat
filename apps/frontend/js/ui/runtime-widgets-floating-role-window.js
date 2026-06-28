export function renderFloatingRoleWindow({
    container,
    statusWindow,
    roles,
    speakingRoleIds = [],
    buildAvatarDataUrl,
    isMuted,
    isExcluded,
    onToggleMuted,
    onToggleExcluded
}) {
    container.innerHTML = '';

    if (!roles.length) {
        statusWindow.style.display = 'none';
        return;
    }

    statusWindow.style.display = 'block';
    const speakingSet = new Set(speakingRoleIds || []);

    for (const role of roles) {
        const item = document.createElement('div');
        item.className = 'ai-status-item';

        const avatar = document.createElement('img');
        avatar.src = buildAvatarDataUrl(role.name || role.id);
        avatar.alt = role.name || role.id;
        if (speakingSet.size > 0 && !speakingSet.has(role.id)) {
            avatar.classList.add('inactive-avatar');
        }

        const nameSpan = document.createElement('span');
        nameSpan.textContent = role.name;

        const buttons = document.createElement('div');
        buttons.style.display = 'flex';

        const muteBtn = document.createElement('button');
        muteBtn.className = 'mute-ai-btn';
        muteBtn.textContent = '!';
        if (isMuted(role)) {
            muteBtn.classList.add('muted');
        }
        muteBtn.addEventListener('click', () => onToggleMuted(role));

        const skipBtn = document.createElement('button');
        skipBtn.className = 'close-ai-btn';
        skipBtn.textContent = 'X';
        if (isExcluded(role)) {
            skipBtn.classList.add('excluded-next-round');
        }
        skipBtn.addEventListener('click', () => onToggleExcluded(role));

        buttons.appendChild(muteBtn);
        buttons.appendChild(skipBtn);
        item.appendChild(avatar);
        item.appendChild(nameSpan);
        item.appendChild(buttons);
        container.appendChild(item);
    }
}
