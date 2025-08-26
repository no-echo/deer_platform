// 用户中心JavaScript功能模块

let currentUser = null;
let userPosts = [];

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    loadUserProfile();
    bindEvents();
});

// 绑定事件
function bindEvents() {
    // 个人资料表单提交
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', updateProfile);
    }
    
    // 头像上传
    const avatarInput = document.getElementById('avatar-input');
    if (avatarInput) {
        avatarInput.addEventListener('change', handleAvatarUpload);
    }
    
    // 密码修改表单
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', changePassword);
    }
}

// 检查登录状态
function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    if (!token || !username) {
        alert('请先登录');
        window.location.href = 'login.html';
        return;
    }
}

// 加载用户资料
async function loadUserProfile() {
    try {
        const response = await userAPI.getProfile();
        if (response.success) {
            currentUser = response.data;
            displayUserProfile(currentUser);
        } else {
            alert('获取用户信息失败: ' + response.message);
        }
    } catch (error) {
        console.error('获取用户信息失败:', error);
        alert('获取用户信息失败，请稍后重试');
    }
}

// 显示用户资料
function displayUserProfile(user) {
    // 更新侧边栏用户信息
    const userAvatar = document.getElementById('user-avatar');
    const userNickname = document.getElementById('user-nickname');
    const userBio = document.getElementById('user-bio');
    
    if (userAvatar) {
        if (user.avatar) {
            userAvatar.style.backgroundImage = `url(${user.avatar})`;
            userAvatar.style.backgroundSize = 'cover';
            userAvatar.style.backgroundPosition = 'center';
            userAvatar.textContent = '';
        } else {
            userAvatar.textContent = user.nickname.charAt(0);
        }
    }
    
    if (userNickname) {
        userNickname.textContent = user.nickname;
    }
    
    if (userBio) {
        userBio.textContent = user.bio || '这个用户很懒，什么都没有留下';
    }
    
    // 填充表单数据
    const nicknameInput = document.getElementById('nickname');
    const emailInput = document.getElementById('email');
    const bioInput = document.getElementById('bio');
    const locationInput = document.getElementById('location');
    
    if (nicknameInput) nicknameInput.value = user.nickname || '';
    if (emailInput) emailInput.value = user.email || '';
    if (bioInput) bioInput.value = user.bio || '';
    if (locationInput) locationInput.value = user.location || '';
    
    // 更新头像预览
    const avatarPreview = document.getElementById('avatar-preview');
    if (avatarPreview) {
        if (user.avatar) {
            avatarPreview.style.backgroundImage = `url(${user.avatar})`;
            avatarPreview.style.backgroundSize = 'cover';
            avatarPreview.style.backgroundPosition = 'center';
            avatarPreview.textContent = '';
        } else {
            avatarPreview.textContent = user.nickname.charAt(0);
        }
    }
    
    // 更新统计数据
    updateUserStats();
}

// 更新用户统计数据
async function updateUserStats() {
    try {
        // 获取用户发布的帖子数量
        const postsResponse = await postAPI.getUserPosts(currentUser.id, 1, 1);
        if (postsResponse.success) {
            document.getElementById('posts-count').textContent = postsResponse.data.total || 0;
            document.getElementById('my-posts-count').textContent = postsResponse.data.total || 0;
        }
        
        // 暂时设置默认值
        document.getElementById('collections-count').textContent = '0';
        document.getElementById('my-collections-count').textContent = '0';
        document.getElementById('follows-count').textContent = '0';
    } catch (error) {
        console.error('获取用户统计数据出错:', error);
    }
}

// 更新个人资料
async function updateProfile(event) {
    event.preventDefault();
    
    const formData = {
        nickname: document.getElementById('nickname').value,
        email: document.getElementById('email').value,
        bio: document.getElementById('bio').value,
        location: document.getElementById('location').value
    };
    
    try {
        const response = await userAPI.updateProfile(formData);
        if (response.success) {
            alert('个人资料更新成功！');
            currentUser = { ...currentUser, ...formData };
            displayUserProfile(currentUser);
        } else {
            alert('更新失败：' + response.message);
        }
    } catch (error) {
        console.error('更新个人资料出错:', error);
        alert('更新失败，请稍后重试');
    }
}

// 处理头像上传
async function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 文件验证
    if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
        alert('图片大小不能超过2MB');
        return;
    }
    
    const response = await fileAPI.uploadAvatar(file);
    if (response.success) {
        // 更新用户头像
        const avatarUrl = response.data.url;
        currentUser.avatar = avatarUrl;
        
        // 更新显示
        const avatarElement = document.getElementById('user-avatar');
        const avatarPreview = document.getElementById('avatar-preview');
        
        avatarElement.style.backgroundImage = `url(${avatarUrl})`;
        avatarElement.style.backgroundSize = 'cover';
        avatarElement.style.backgroundPosition = 'center';
        avatarElement.textContent = '';
        
        avatarPreview.style.backgroundImage = `url(${avatarUrl})`;
        avatarPreview.style.backgroundSize = 'cover';
        avatarPreview.style.backgroundPosition = 'center';
        avatarPreview.textContent = '';
        
        alert('头像上传成功！');
    } else {
        alert('头像上传失败：' + response.message);
    }
}

// 修改密码
async function changePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (newPassword !== confirmPassword) {
        alert('两次输入的新密码不一致');
        return;
    }
    
    try {
        const response = await authAPI.changePassword({
            oldPassword: currentPassword,
            newPassword: newPassword
        });
        
        if (response.success) {
            alert('密码修改成功！');
            document.getElementById('password-form').reset();
        } else {
            alert('密码修改失败：' + response.message);
        }
    } catch (error) {
        console.error('修改密码出错:', error);
        alert('密码修改失败，请稍后重试');
    }
}

// 加载我的发布
async function loadMyPosts() {
    const response = await postAPI.getUserPosts(currentUser.id, 1, 20);
    if (response.success && response.data.posts.length > 0) {
        userPosts = response.data.posts;
        displayMyPosts(userPosts);
    }
}

// 删除帖子
async function deletePost(postId) {
    if (!confirm('确定要删除这篇帖子吗？')) return;
    
    const response = await postAPI.delete(postId);
    if (response.success) {
        loadMyPosts(); // 重新加载列表
        updateUserStats(); // 更新统计数据
    }
}

// 显示我的发布
function displayMyPosts(posts) {
    const listElement = document.getElementById('my-posts-list');
    
    listElement.innerHTML = posts.map(post => `
        <div class="post-item">
            <div class="post-item-header">
                <a href="post-detail.html?id=${post.id}" class="post-item-title">${escapeHtml(post.title)}</a>
                <div class="post-item-actions">
                    <a href="create-post.html?edit=${post.id}" class="action-link">编辑</a>
                    <a href="#" class="action-link" onclick="deletePost(${post.id})">删除</a>
                </div>
            </div>
            <div class="post-item-meta">
                <span>发布时间：${formatDate(post.createdAt)}</span>
                <span>分类：${escapeHtml(post.categoryName || '未分类')}</span>
                <span>阅读：${post.viewCount || 0}</span>
                <span>状态：${getPostStatusText(post.status)}</span>
            </div>
        </div>
    `).join('');
}

// 加载我的收藏
async function loadMyCollections() {
    // 这里需要实现收藏相关的API调用
    // 暂时显示空状态
    document.getElementById('my-collections-empty').style.display = 'block';
}

// 退出登录
function logout() {
    if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        window.location.href = 'login.html';
    }
}

// 确认注销账户
function confirmDeleteAccount() {
    if (confirm('警告：此操作将永久删除您的账户和所有数据，且不可恢复。确定要继续吗？')) {
        if (confirm('请再次确认：您真的要注销账户吗？')) {
            alert('账户注销功能开发中，如需注销请联系客服。');
        }
    }
}

// 显示内容区域
function showContent(section) {
    // 隐藏所有内容区域
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(s => s.style.display = 'none');
    
    // 移除所有导航项的active类
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => link.classList.remove('active'));
    
    // 显示选中的内容区域
    document.getElementById(section + '-content').style.display = 'block';
    
    // 添加active类到当前导航项
    event.target.classList.add('active');
    
    // 根据选择的内容加载相应数据
    switch(section) {
        case 'posts':
            loadMyPosts();
            break;
        case 'collections':
            loadMyCollections();
            break;
    }
}

// 工具函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
}

function getPostStatusText(status) {
    const statusMap = {
        'PUBLISHED': '已发布',
        'DRAFT': '草稿',
        'PENDING': '待审核',
        'REJECTED': '已拒绝'
    };
    return statusMap[status] || '未知';
}