import { translateUiText } from '../core/i18n.js';

// ========== Toast 通知 ==========
export function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = translateUiText(message);
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('toast-show'), 10);
    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========== Loading 状态 ==========
export function showLoading(message = '加载中...') {
    if (document.getElementById('global-loader')) return;
    const loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.innerHTML = `
        <div class="loader-backdrop"></div>
        <div class="loader-content">
            <div class="spinner"></div>
            <p>${translateUiText(message)}</p>
        </div>
    `;
    document.body.appendChild(loader);
}

export function hideLoading() {
    document.getElementById('global-loader')?.remove();
}

// ========== 防抖 ==========
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
