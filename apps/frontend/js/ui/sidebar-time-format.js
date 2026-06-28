import { isEnglishLocale } from '../core/i18n.js';

export function formatSidebarSessionTime(timestamp) {
    if (!timestamp) {
        return '';
    }
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
        return isEnglishLocale() ? 'Just now' : '刚刚';
    }
    if (minutes < 60) {
        return isEnglishLocale() ? `${minutes} min ago` : `${minutes}分钟前`;
    }
    if (hours < 24) {
        return isEnglishLocale() ? `${hours} hr ago` : `${hours}小时前`;
    }
    if (days < 7) {
        return isEnglishLocale() ? `${days} days ago` : `${days}天前`;
    }
    return date.toLocaleDateString(isEnglishLocale() ? 'en' : 'zh-CN');
}
