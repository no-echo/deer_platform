// 错误处理工具类
class ErrorHandler {
    constructor() {
        this.errorContainer = null;
        this.init();
    }

    // 初始化错误处理器
    init() {
        // 创建全局错误提示容器
        this.createErrorContainer();
        
        // 监听全局错误
        window.addEventListener('error', (event) => {
            this.handleGlobalError(event.error);
        });
        
        // 监听Promise未捕获的错误
        window.addEventListener('unhandledrejection', (event) => {
            this.handleGlobalError(event.reason);
            event.preventDefault();
        });
    }

    // 创建错误提示容器
    createErrorContainer() {
        if (document.getElementById('error-container')) return;
        
        const container = document.createElement('div');
        container.id = 'error-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(container);
        this.errorContainer = container;
    }

    // 显示错误提示
    showError(message, type = 'error', duration = 5000) {
        const errorElement = document.createElement('div');
        errorElement.className = `alert alert-${type}`;
        errorElement.style.cssText = `
            padding: 12px 16px;
            margin-bottom: 10px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            animation: slideInRight 0.3s ease-out;
            cursor: pointer;
            position: relative;
            word-wrap: break-word;
        `;
        
        // 根据类型设置样式
        const styles = {
            error: { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' },
            warning: { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' },
            success: { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
            info: { bg: '#d1ecf1', color: '#0c5460', border: '#bee5eb' }
        };
        
        const style = styles[type] || styles.error;
        errorElement.style.backgroundColor = style.bg;
        errorElement.style.color = style.color;
        errorElement.style.border = `1px solid ${style.border}`;
        
        errorElement.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${this.escapeHtml(message)}</span>
                <button style="background: none; border: none; font-size: 18px; cursor: pointer; color: inherit; margin-left: 10px;" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;
        
        // 点击关闭
        errorElement.addEventListener('click', () => {
            errorElement.remove();
        });
        
        this.errorContainer.appendChild(errorElement);
        
        // 自动关闭
        if (duration > 0) {
            setTimeout(() => {
                if (errorElement.parentNode) {
                    errorElement.remove();
                }
            }, duration);
        }
        
        return errorElement;
    }

    // 处理API错误
    handleApiError(error, context = '') {
        console.error(`API错误 ${context}:`, error);
        
        let message = '操作失败，请稍后重试';
        
        if (error.message) {
            // 根据错误信息提供更友好的提示
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                message = '登录已过期，请重新登录';
                this.handleAuthError();
            } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
                message = '没有权限执行此操作';
            } else if (error.message.includes('404') || error.message.includes('Not Found')) {
                message = '请求的资源不存在';
            } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
                message = '服务器内部错误，请稍后重试';
            } else if (error.message.includes('网络') || error.message.includes('Network')) {
                message = '网络连接失败，请检查网络设置';
            } else {
                message = error.message;
            }
        }
        
        this.showError(message, 'error');
        return message;
    }

    // 处理认证错误
    handleAuthError() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        
        setTimeout(() => {
            if (window.location.pathname !== '/login.html') {
                window.location.href = 'login.html';
            }
        }, 2000);
    }

    // 处理表单验证错误
    handleValidationError(errors) {
        if (Array.isArray(errors)) {
            errors.forEach(error => {
                this.showError(error, 'warning', 3000);
            });
        } else if (typeof errors === 'object') {
            Object.values(errors).forEach(error => {
                this.showError(error, 'warning', 3000);
            });
        } else {
            this.showError(errors, 'warning', 3000);
        }
    }

    // 处理全局错误
    handleGlobalError(error) {
        console.error('全局错误:', error);
        
        // 避免显示过多的错误提示
        if (this.errorContainer.children.length < 3) {
            this.showError('页面出现异常，请刷新页面重试', 'error');
        }
    }

    // 显示成功提示
    showSuccess(message, duration = 3000) {
        return this.showError(message, 'success', duration);
    }

    // 显示警告提示
    showWarning(message, duration = 4000) {
        return this.showError(message, 'warning', duration);
    }

    // 显示信息提示
    showInfo(message, duration = 3000) {
        return this.showError(message, 'info', duration);
    }

    // 显示加载提示
    showLoading(message = '加载中...') {
        const loadingElement = this.showError(message, 'info', 0);
        loadingElement.classList.add('loading-message');
        
        // 添加加载动画
        const spinner = document.createElement('div');
        spinner.style.cssText = `
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #f3f3f3;
            border-top: 2px solid #007bff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 8px;
        `;
        
        loadingElement.querySelector('span').insertBefore(spinner, loadingElement.querySelector('span').firstChild);
        
        return loadingElement;
    }

    // 隐藏加载提示
    hideLoading() {
        const loadingElements = this.errorContainer.querySelectorAll('.loading-message');
        loadingElements.forEach(element => element.remove());
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 清除所有提示
    clearAll() {
        this.errorContainer.innerHTML = '';
    }
}

// 添加CSS动画
if (!document.getElementById('error-handler-styles')) {
    const style = document.createElement('style');
    style.id = 'error-handler-styles';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .alert {
            transition: all 0.3s ease;
        }
        
        .alert:hover {
            transform: translateX(-5px);
        }
    `;
    document.head.appendChild(style);
}

// 创建全局实例
const errorHandler = new ErrorHandler();

// 导出到全局
window.errorHandler = errorHandler;

// 删除以下问题代码（第258-268行）
// if (typeof window !== 'undefined' && window.formValidator && typeof window.formValidator.bindForm === 'function') {
//     if (typeof form !== 'undefined' && form && typeof rules !== 'undefined' && rules) {
//         try {
//             formValidator.bindForm(form, rules);
//         } catch (error) {
//             console.error('formValidator.bindForm调用失败:', error);
//         }
//     }
// } else {
//     console.warn('formValidator.bindForm不可用，跳过表单验证绑定');
// }