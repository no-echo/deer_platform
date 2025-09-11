// 注册页面JavaScript功能模块

let verificationCountdown = 0;
let verificationTimer = null;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeRegisterForm();
    bindAvatarPreview();
    bindVerificationCode();
});

// 初始化注册表单
function initializeRegisterForm() {
    // 表单验证规则
    const validationRules = {
        username: {
            required: true,
            minLength: 3,
            maxLength: 20,
            pattern: /^[a-zA-Z0-9_]+$/,
            message: '用户名3-20个字符，只能包含字母、数字和下划线'
        },
        nickname: {
            required: true,
            minLength: 2,
            maxLength: 10,
            message: '昵称2-10个字符'
        },
        email: {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: '请输入有效的邮箱地址'
        },
        'verification-code': {
            required: true,
            length: 6,
            pattern: /^\d{6}$/,
            message: '请输入6位数字验证码'
        },
        password: {
            required: true,
            minLength: 6,
            maxLength: 20,
            message: '密码6-20个字符'
        },
        'confirm-password': {
            required: true,
            custom: function(value) {
                const password = document.getElementById('password').value;
                return value === password;
            },
            message: '两次输入的密码不一致'
        }
    };
    
    // 绑定表单验证
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        formValidator.bindForm(registerForm, validationRules);
        // 绑定表单提交事件
        registerForm.addEventListener('submit', handleRegister);
    }
}

// 绑定头像预览功能
function bindAvatarPreview() {
    const avatarInput = document.getElementById('avatar-input');
    const avatarPreview = document.querySelector('.avatar-preview');
    
    if (!avatarInput) {
        return;
    }
    
    avatarInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // 文件类型验证
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            this.value = '';
            return;
        }
        
        // 文件大小验证（2MB）
        if (file.size > 2 * 1024 * 1024) {
            alert('图片大小不能超过2MB');
            this.value = '';
            return;
        }
        
        // 显示预览
        const reader = new FileReader();
        reader.onload = function(e) {
            if (avatarPreview) {
                avatarPreview.innerHTML = `<img src="${e.target.result}" alt="头像预览" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            }
        };
        reader.readAsDataURL(file);
    });
}

// 绑定验证码功能
function bindVerificationCode() {
    const sendCodeBtn = document.getElementById('sendCodeBtn');
    if (sendCodeBtn) {
        // 确保移除之前可能存在的事件监听器
        sendCodeBtn.removeEventListener('click', sendVerificationCode);
        // 重新绑定事件
        sendCodeBtn.addEventListener('click', sendVerificationCode);
    }
}

// 发送验证码
async function sendVerificationCode() {
    const emailInput = document.getElementById('email');
    const email = emailInput.value.trim();
    
    // 邮箱验证
    if (!email) {
        errorHandler.showError('请输入邮箱地址');
        return;
    }
    
    if (!formValidator.validateField(emailInput, 'email')) {
        return;
    }
    
    const button = document.getElementById('sendCodeBtn');
    
    try {
        button.disabled = true;
        button.textContent = '发送中...';
        
        const response = await authAPI.sendVerificationCode(email);
        
        if (response.success) {
            errorHandler.showSuccess('验证码已发送到您的邮箱，请查收');
            startCountdown(button);
        } else {
            errorHandler.showError(response.message || '发送验证码失败');
            button.disabled = false;
            button.textContent = '发送验证码';
        }
    } catch (error) {
        console.error('发送验证码异常:', error);
        errorHandler.showError('发送验证码失败，请稍后重试');
        button.disabled = false;
        button.textContent = '发送验证码';
    }
}

// 开始倒计时
function startCountdown() {
    const sendCodeBtn = document.getElementById('sendCodeBtn');
    verificationCountdown = 60;
    sendCodeBtn.disabled = true;
    
    verificationTimer = setInterval(() => {
        sendCodeBtn.textContent = `${verificationCountdown}秒后重发`;
        verificationCountdown--;
        
        if (verificationCountdown < 0) {
            clearInterval(verificationTimer);
            sendCodeBtn.disabled = false;
            sendCodeBtn.textContent = '发送验证码';
        }
    }, 1000);
}

// 处理注册
async function handleRegister(event) {
    event.preventDefault();
    
    // 获取表单数据
    const usernameEl = document.getElementById('username');
    const nicknameEl = document.getElementById('nickname');
    const emailEl = document.getElementById('email');
    const verificationCodeEl = document.getElementById('verification-code');
    const passwordEl = document.getElementById('password');
    const confirmPasswordEl = document.getElementById('confirm-password');
    
    // 检查必需元素是否存在
    if (!usernameEl || !emailEl || !verificationCodeEl || !passwordEl || !confirmPasswordEl) {
        errorHandler.showError('表单元素加载失败，请刷新页面重试');
        return;
    }
    
    const formData = {
        username: usernameEl.value.trim(),
        nickname: nicknameEl ? nicknameEl.value.trim() : '',
        email: emailEl.value.trim(),
        verificationCode: verificationCodeEl.value.trim(),
        password: passwordEl.value,
        confirmPassword: confirmPasswordEl.value
    };
    
    // 确认密码验证
    if (formData.password !== formData.confirmPassword) {
        alert('两次输入的密码不一致');
        return;
    }
    
    // 表单验证
    if (!formValidator.validateForm('registerForm')) {
        return;
    }
    
    try {
        // 显示加载状态
        const submitBtn = document.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '注册中...';
        submitBtn.disabled = true;
        
        // 清除之前的错误信息
        errorHandler.clearAll();
        
        // 调用注册API
        const response = await authAPI.registerWithEmail({
            username: formData.username,
            nickname: formData.nickname,
            email: formData.email,
            verificationCode: formData.verificationCode,
            password: formData.password,
            confirmPassword: formData.confirmPassword
        });
        
        if (response.success) {
            alert('注册成功！请登录。');
            window.location.href = 'login.html';
        } else {
            errorHandler.showError(response.message || '注册失败');
        }
    } catch (error) {
        console.error('注册失败:', error);
        errorHandler.showError('注册失败，请检查网络连接');
    } finally {
        // 恢复按钮状态
        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.textContent = '注册';
        submitBtn.disabled = false;
    }
}