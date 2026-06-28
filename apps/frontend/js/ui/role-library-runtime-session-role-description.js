import { translateUiText } from '../core/i18n.js';

export function buildRoleLibrarySessionRoleDescription(role) {
    return (
        role.description ||
        role.role_spec?.description ||
        role.role_spec?.persona ||
        role.persona ||
        translateUiText('暂无描述')
    );
}
