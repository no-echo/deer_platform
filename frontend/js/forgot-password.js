// 忘记密码页面JavaScript功能模块

let currentStep = 1;
let countdown = 0;
let userEmail = ''; // 存储用户邮箱

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeForms();
});

// 初始化表单
function initializeForms() {
    // 第一步：发送验证码
    const emailForm = document.getElementById('emailForm');
    if (emailForm) {
        emailForm.addEventListener('submit', handleSendCode);
    }
    
    // 第二步：验证码验证
    const verifyForm = document.getElementById('verifyForm');
    if (verifyForm) {
        verifyForm.addEventListener('submit', handleVerifyCode);
    }
    
    // 第三步：重置密码
    const resetForm = document.getElementById('resetForm');
    if (resetForm) {
        resetForm.addEventListener('submit', handleResetPassword);
    }
    
    // 重新发送验证码
    const resendBtn = document.getElementById('resendCodeBtn');
    if (resendBtn) {
        resendBtn.addEventListener('click', handleResendCode);
    }
}

// 第一步：发送验证码
async function handleSendCode(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    if (!email) {
        alert('请输入邮箱地址');
        return;
    }
    
    // 验证邮箱格式
    const emailErrors = formValidator.validateField(email, ['email']);
    if (emailErrors.length > 0) {
        alert('请输入有效的邮箱地址');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = '发送中...';
    
    try {
        console.log('发送密码重置验证码到:', email);
        const response = await authAPI.sendPasswordResetCode(email);
        
        if (response.success) {
            userEmail = email; // 保存邮箱
            alert('验证码已发送到您的邮箱，请查收');
            nextStep();
        } else {
            alert(response.message || '发送验证码失败');
        }
    } catch (error) {
        console.error('发送验证码失败:', error);
        alert('发送验证码失败，请检查网络连接或稍后重试');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '发送验证码';
    }
}

// 第二步：验证码验证（这里只是验证格式，真正的验证在重置密码时进行）
function handleVerifyCode(e) {
    e.preventDefault();
    
    const code = document.getElementById('verification-code').value;
    if (!code) {
        alert('请输入验证码');
        return;
    }
    
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
        alert('验证码应为6位数字');
        return;
    }
    
    // 验证码格式正确，进入下一步
    nextStep();
}

// 第三步：重置密码
async function handleResetPassword(e) {
    e.preventDefault();
    
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;
    const verificationCode = document.getElementById('verification-code').value;
    
    if (!newPassword || !confirmPassword) {
        alert('请输入新密码');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('两次输入的密码不一致');
        return;
    }
    
    // 验证密码强度
    const passwordErrors = formValidator.validateField(newPassword, ['password']);
    if (passwordErrors.length > 0) {
        alert('密码长度至少6位，且包含字母和数字');
        return;
    }
    
    if (!verificationCode) {
        alert('请输入验证码');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = '重置中...';
    
    try {
        console.log('重置密码，邮箱:', userEmail);
        const response = await authAPI.resetPassword({
            email: userEmail,
            newPassword: newPassword,
            confirmPassword: confirmPassword,
            verificationCode: verificationCode
        });
        
        if (response.success) {
            alert('密码重置成功！请使用新密码登录。');
            window.location.href = 'login.html';
        } else {
            alert(response.message || '密码重置失败');
        }
    } catch (error) {
        console.error('密码重置失败:', error);
        alert('密码重置失败，请检查验证码是否正确或稍后重试');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '重置密码';
    }
}

// 重新发送验证码
async function handleResendCode() {
    if (!userEmail) {
        alert('请先输入邮箱地址');
        return;
    }
    
    const resendBtn = document.getElementById('resendCodeBtn');
    resendBtn.disabled = true;
    resendBtn.textContent = '发送中...';
    
    try {
        console.log('重新发送密码重置验证码到:', userEmail);
        const response = await authAPI.sendPasswordResetCode(userEmail);
        
        if (response.success) {
            alert('验证码已重新发送到您的邮箱');
            
            // 开始倒计时
            countdown = 60;
            const timer = setInterval(() => {
                resendBtn.textContent = `${countdown}秒后重发`;
                countdown--;
                
                if (countdown < 0) {
                    clearInterval(timer);
                    resendBtn.disabled = false;
                    resendBtn.textContent = '重新发送';
                }
            }, 1000);
        } else {
            alert(response.message || '重新发送验证码失败');
            resendBtn.disabled = false;
            resendBtn.textContent = '重新发送';
        }
    } catch (error) {
        console.error('重新发送验证码失败:', error);
        alert('重新发送验证码失败，请稍后重试');
        resendBtn.disabled = false;
        resendBtn.textContent = '重新发送';
    }
}

// 下一步
function nextStep() {
    // 隐藏当前步骤
    document.getElementById(`content${currentStep}`).classList.remove('active');
    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.getElementById(`step${currentStep}`).classList.add('completed');
    
    // 显示下一步
    currentStep++;
    document.getElementById(`content${currentStep}`).classList.add('active');
    document.getElementById(`step${currentStep}`).classList.add('active');
}