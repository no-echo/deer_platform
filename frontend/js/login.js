// 登录页面JavaScript功能模块

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeLoginForm();
});

// 初始化登录表单
function initializeLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) {
        console.error('登录表单未找到');
        return;
    }

    const validationRules = {
        username: [
            { type: 'required', message: '请输入用户名' },
            { type: 'minLength', param: 3, message: '用户名至少3个字符' }
        ],
        password: [
            { type: 'required', message: '请输入密码' },
            { type: 'minLength', param: 6, message: '密码至少6个字符' }
        ]
    };
    
    // 修复：传递DOM元素而非字符串
    if (window.formValidator && typeof window.formValidator.bindForm === 'function') {
        formValidator.bindForm(loginForm, validationRules);
    } else {
        console.error('formValidator未加载或bindForm方法不存在');
    }
    
    // 绑定表单提交事件
    loginForm.addEventListener('submit', handleLogin);
}

// 处理登录
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember').checked;
    
    // 表单验证
    if (!formValidator.validateForm('loginForm')) {
        return;
    }
    
    try {
        // 显示加载状态
        const submitBtn = document.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '登录中...';
        submitBtn.disabled = true;
        
        // 调用登录API - 修复：传递两个独立参数而不是对象
        const response = await authAPI.login(username, password);
        
        if (response.success) {
            // 保存登录信息
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', response.data.user.username);  // 修复：使用response.data.user.username
            localStorage.setItem('nickname', response.data.user.nickname);   // 修复：使用response.data.user.nickname
            localStorage.setItem('userId', response.data.user.id);           // 修复：使用response.data.user.id
            localStorage.setItem('userRole', response.data.user.role);
            
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
            }
            
            alert('登录成功！');
            
            // 跳转到首页或返回页面
            const returnUrl = new URLSearchParams(window.location.search).get('return') || 'index.html';
            window.location.href = returnUrl;
        } else {
            errorHandler.showError(response.message || '登录失败');
        }
    } catch (error) {
        console.error('登录失败:', error);
        errorHandler.showError('登录失败，请检查网络连接');
    } finally {
        // 恢复按钮状态
        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.textContent = '登录';
        submitBtn.disabled = false;
    }
}