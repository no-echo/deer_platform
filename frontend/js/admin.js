// 管理员页面JavaScript功能模块

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    checkAdminPermission();
    initializeDashboard();
    bindEvents();
});

// 检查管理员权限
function checkAdminPermission() {
    const userRole = localStorage.getItem('userRole');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (!isLoggedIn || userRole !== 'admin') {
        alert('您没有权限访问此页面');
        window.location.href = 'login.html';
        return;
    }
}

// 初始化仪表板
function initializeDashboard() {
    // 加载统计数据
    loadDashboardStats();
    
    // 加载最新活动
    loadRecentActivities();
    
    // 加载待处理事项
    loadPendingItems();
}

// 绑定事件
function bindEvents() {
    // 侧边栏导航
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href').substring(1);
            showSection(target);
            
            // 更新导航状态
            document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// 显示指定区域
function showSection(sectionId) {
    // 隐藏所有区域
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // 显示目标区域
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // 根据区域加载相应数据
    switch(sectionId) {
        case 'users':
            loadUsers();
            break;
        case 'posts':
            loadPosts();
            break;
        case 'categories':
            loadCategories();
            break;
        case 'comments':
            loadComments();
            break;
        case 'reports':
            loadReports();
            break;
    }
}

// 加载仪表板统计数据
async function loadDashboardStats() {
    try {
        // 这里应该调用真实的API获取统计数据
        // 暂时使用模拟数据
        document.getElementById('total-users').textContent = '0';
        document.getElementById('total-posts').textContent = '0';
        document.getElementById('total-comments').textContent = '0';
        document.getElementById('pending-reviews').textContent = '0';
    } catch (error) {
        console.error('加载统计数据失败:', error);
    }
}

// 加载最新活动
async function loadRecentActivities() {
    try {
        // 这里应该调用真实的API获取最新活动
        // 暂时使用模拟数据
        const activitiesList = document.getElementById('recent-activities');
        if (activitiesList) {
            activitiesList.innerHTML = '<li>暂无最新活动</li>';
        }
    } catch (error) {
        console.error('加载最新活动失败:', error);
    }
}

// 加载待处理事项
async function loadPendingItems() {
    try {
        // 这里应该调用真实的API获取待处理事项
        // 暂时使用模拟数据
        const pendingList = document.getElementById('pending-items');
        if (pendingList) {
            pendingList.innerHTML = '<li>暂无待处理事项</li>';
        }
    } catch (error) {
        console.error('加载待处理事项失败:', error);
    }
}

// 加载用户列表
async function loadUsers() {
    try {
        // 这里应该调用真实的API获取用户列表
        console.log('加载用户列表');
    } catch (error) {
        console.error('加载用户列表失败:', error);
    }
}

// 加载帖子列表
async function loadPosts() {
    try {
        // 这里应该调用真实的API获取帖子列表
        console.log('加载帖子列表');
    } catch (error) {
        console.error('加载帖子列表失败:', error);
    }
}

// 加载分类列表
async function loadCategories() {
    try {
        // 这里应该调用真实的API获取分类列表
        console.log('加载分类列表');
    } catch (error) {
        console.error('加载分类列表失败:', error);
    }
}

// 加载评论列表
async function loadComments() {
    try {
        // 这里应该调用真实的API获取评论列表
        console.log('加载评论列表');
    } catch (error) {
        console.error('加载评论列表失败:', error);
    }
}

// 加载举报列表
async function loadReports() {
    try {
        // 这里应该调用真实的API获取举报列表
        console.log('加载举报列表');
    } catch (error) {
        console.error('加载举报列表失败:', error);
    }
}

// 实时更新统计数据（模拟）
function updateStats() {
    // 这里可以通过AJAX获取最新的统计数据
    console.log('更新统计数据');
}

// 每30秒更新一次统计数据
setInterval(updateStats, 30000);