// 首页JavaScript功能模块

// 页面加载时检查登录状态并加载帖子数据
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    loadCategoriesAndPosts();
    initializeSearch();
    
    // 绑定退出登录按钮事件
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const username = localStorage.getItem('username') || localStorage.getItem('nickname');
    
    const guestActions = document.getElementById('guestActions');
    const userWelcome = document.getElementById('userWelcome');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const joinButton = document.querySelector('.banner .btn.btn-primary');
    
    if (isLoggedIn === 'true' && username) {
        // 用户已登录，显示欢迎信息
        if (guestActions) guestActions.style.display = 'none';
        if (userWelcome) userWelcome.style.display = 'flex';
        if (usernameDisplay) usernameDisplay.textContent = dataProcessor.escapeHtml(username);
        // 隐藏"立即加入"按钮
        if (joinButton) joinButton.style.display = 'none';
    } else {
        // 用户未登录，显示登录/注册按钮
        if (guestActions) guestActions.style.display = 'flex';
        if (userWelcome) userWelcome.style.display = 'none';
        // 显示"立即加入"按钮
        if (joinButton) joinButton.style.display = 'inline-flex';
    }
}

// 加载分类和帖子数据
async function loadCategoriesAndPosts() {
    try {
        errorHandler.showLoading('正在加载内容...');
        
        // 获取分类列表
        const categoriesResponse = await categoryAPI.getAll();
        const processedCategories = dataProcessor.processApiResponse(categoriesResponse);
        
        if (!processedCategories.success) {
            throw new Error(processedCategories.message);
        }
        
        const categories = processedCategories.data;
        
        // 更新导航菜单中的分类链接
        updateNavigationCategories(categories);
        
        // 获取每个分类的最新帖子
        const categoryCards = document.querySelectorAll('.category-card');
        
        for (let i = 0; i < Math.min(categories.length, categoryCards.length); i++) {
            const category = categories[i];
            const card = categoryCards[i];
            
            // 更新分类标题
            const titleElement = card.querySelector('.category-title');
            if (titleElement) {
                titleElement.textContent = dataProcessor.escapeHtml(category.name);
            }
            
            // 获取该分类的帖子
            const postsResponse = await postAPI.getList({ 
                categoryId: category.id, 
                page: 0, 
                size: 4 
            });
            
            const processedPosts = dataProcessor.processApiResponse(postsResponse);
            
            if (processedPosts.success && processedPosts.data) {
                // 更新帖子列表
                const postList = card.querySelector('.post-list');
                if (postList) {
                    postList.innerHTML = processedPosts.data.map(post => {
                        const formattedPost = dataProcessor.formatPostForDisplay(post);
                        return `
                            <li class="post-item">
                                <div class="post-link">
                                    <a href="post-detail.html?id=${formattedPost.id}" class="post-title">${formattedPost.title}</a>
                                    <span class="post-meta">${formattedPost.formattedTime}</span>
                                </div>
                            </li>
                        `;
                    }).join('');
                }
            }
            
            // 更新"查看更多"链接
            const moreLink = card.querySelector('.more-link a');
            if (moreLink) {
                moreLink.href = `category.html?id=${category.id}`;
            }
        }
        
        errorHandler.hideLoading();
        
    } catch (error) {
        console.error('加载数据失败:', error);
        errorHandler.hideLoading();
        errorHandler.showError('加载页面内容失败，请刷新页面重试');
        // 如果API调用失败，保持静态数据显示
    }
}

// 更新导航菜单中的分类链接
function updateNavigationCategories(categories) {
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) return;
    
    // 找到分类相关的导航项（除了首页）
    const categoryLinks = navMenu.querySelectorAll('li:not(:first-child) a');
    
    // 更新前4个分类链接
    for (let i = 0; i < Math.min(categories.length, categoryLinks.length); i++) {
        const category = categories[i];
        const link = categoryLinks[i];
        
        if (link && category) {
            link.href = `category.html?id=${category.id}`;
            link.textContent = dataProcessor.escapeHtml(category.name);
        }
    }
}

// 初始化搜索功能
function initializeSearch() {
    const searchInput = document.querySelector('.search-box input');
    const searchButton = document.querySelector('.search-box button');
    
    if (searchButton) {
        // 搜索按钮点击事件
        searchButton.addEventListener('click', performSearch);
    }
    
    if (searchInput) {
        // 回车键搜索
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
}

// 执行搜索
async function performSearch() {
    const searchInput = document.querySelector('.search-box input');
    const keyword = searchInput.value.trim();
    
    if (keyword) {
        // 数据清理和验证
        const sanitizedKeyword = dataProcessor.sanitizeInput({ keyword }).keyword;
        
        if (sanitizedKeyword.length < 2) {
            errorHandler.showWarning('搜索关键词至少需要2个字符');
            return;
        }
        
        // 跳转到搜索结果页面
        window.location.href = `category.html?search=${encodeURIComponent(sanitizedKeyword)}`;
    } else {
        errorHandler.showWarning('请输入搜索关键词');
    }
}

// 退出登录功能
async function handleLogout() {
    if (confirm('确定要退出登录吗？')) {
        try {
            errorHandler.showLoading('正在退出...');
            
            // 调用后端登出API
            await authAPI.logout();
            
            errorHandler.hideLoading();
        } catch (error) {
            console.error('登出API调用失败:', error);
            errorHandler.hideLoading();
        }
        
        // 清除登录信息
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        localStorage.removeItem('nickname');
        
        // 刷新页面状态
        checkLoginStatus();
        
        errorHandler.showSuccess('已成功退出登录');
    }
}