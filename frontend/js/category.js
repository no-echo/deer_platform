// 分类页面JavaScript功能模块

let currentCategory = null;
let currentPage = 1;
let pageSize = 10;
let totalPages = 0;
let isLoading = false;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    loadCategories();
    setCategoryFromURL();
    bindEvents();
});

// 绑定事件
function bindEvents() {
    // 筛选和排序事件
    const sortSelect = document.getElementById('sortSelect');
    const timeSelect = document.getElementById('timeSelect');
    const statusSelect = document.getElementById('statusSelect');
    
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            currentPage = 1;
            loadPosts();
        });
    }
    
    if (timeSelect) {
        timeSelect.addEventListener('change', () => {
            currentPage = 1;
            loadPosts();
        });
    }
    
    if (statusSelect) {
        statusSelect.addEventListener('change', () => {
            currentPage = 1;
            loadPosts();
        });
    }

    // 视图切换
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            toggleView(this.dataset.view);
        });
    });

    // 搜索功能
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
}

// 检查登录状态
function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    const loginButtons = document.getElementById('login-buttons');
    const userProfile = document.getElementById('user-profile');
    const usernameElement = document.getElementById('username');
    
    if (token && username) {
        if (loginButtons) loginButtons.style.display = 'none';
        if (userProfile) userProfile.style.display = 'flex';
        if (usernameElement) usernameElement.textContent = username;
    } else {
        if (loginButtons) loginButtons.style.display = 'flex';
        if (userProfile) userProfile.style.display = 'none';
    }
}

// 加载分类列表
async function loadCategories() {
    try {
        const response = await categoryAPI.getAll();
        if (response.success) {
            displayCategories(response.data);
        }
    } catch (error) {
        console.error('加载分类失败:', error);
    }
}

// 显示分类导航
function displayCategories(categories) {
    const navMenu = document.getElementById('nav-menu');
    const categoryNav = document.getElementById('category-nav');
    
    // 更新顶部导航
    const categoryLinks = categories.map(cat => 
        `<a href="category.html?cat=${cat.id}" data-category="${cat.id}">${escapeHtml(cat.name)}</a>`
    ).join('');
    if (navMenu) {
        navMenu.innerHTML = `<a href="index.html">首页</a>${categoryLinks}`;
    }
    
    // 更新侧边栏分类导航
    const categoryTags = categories.map(cat => 
        `<a href="category.html?cat=${cat.id}" class="tag" data-category="${cat.id}">${escapeHtml(cat.name)}</a>`
    ).join('');
    if (categoryNav) {
        categoryNav.innerHTML = categoryTags;
    }
}

// 根据URL参数设置分类
function setCategoryFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('cat');
    
    if (categoryId) {
        currentCategory = categoryId;
        loadCategoryInfo(categoryId);
        updateActiveNavigation(categoryId);
    } else {
        // 显示所有分类的帖子
        currentCategory = null;
        const categoryTitle = document.getElementById('category-title');
        const categoryDescription = document.getElementById('category-description');
        if (categoryTitle) categoryTitle.textContent = '全部帖子';
        if (categoryDescription) categoryDescription.textContent = '浏览所有分类下的精彩内容';
    }
    
    loadPosts();
    loadHotPosts();
    loadHotTags();
    loadStats();
}

// 加载分类信息
async function loadCategoryInfo(categoryId) {
    try {
        const response = await categoryAPI.getById(categoryId);
        if (response.success) {
            const category = response.data;
            const categoryTitle = document.getElementById('category-title');
            const categoryDescription = document.getElementById('category-description');
            
            if (categoryTitle) categoryTitle.textContent = category.name;
            if (categoryDescription) categoryDescription.textContent = category.description || '浏览该分类下的精彩内容';
            document.title = `${category.name} - 林麝养殖交流分享平台`;
        }
    } catch (error) {
        console.error('加载分类信息失败:', error);
    }
}

// 更新导航激活状态
function updateActiveNavigation(categoryId) {
    document.querySelectorAll('.nav-menu a, .tag-list a').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.category === categoryId) {
            link.classList.add('active');
        }
    });
}

// 加载帖子列表
async function loadPosts() {
    if (isLoading) return;
    
    isLoading = true;
    showLoading(true);
    
    try {
        const sortSelect = document.getElementById('sortSelect');
        const timeSelect = document.getElementById('timeSelect');
        const statusSelect = document.getElementById('statusSelect');
        
        const sortValue = sortSelect ? sortSelect.value : 'createdAt,desc';
        const timeRange = timeSelect ? timeSelect.value : 'all';
        const status = statusSelect ? statusSelect.value : 'all';
        
        const [sortField, sortOrder] = sortValue.split(',');
        
        const params = {
            page: currentPage,
            size: pageSize,
            sortBy: sortField,
            sortOrder: sortOrder
        };
        
        if (currentCategory) {
            params.categoryId = currentCategory;
        }
        
        if (status !== 'all') {
            params.status = status;
        }
        
        if (timeRange !== 'all') {
            params.timeRange = timeRange;
        }
        
        const response = await postAPI.getList(params);
        
        if (response.success) {
            displayPosts(response.data.posts);
            updatePagination(response.data.currentPage, response.data.totalPages, response.data.total);
            const totalPostsElement = document.getElementById('total-posts');
            if (totalPostsElement) {
                totalPostsElement.textContent = response.data.total;
            }
        } else {
            showError('加载帖子失败: ' + response.message);
        }
    } catch (error) {
        console.error('加载帖子失败:', error);
        showError('加载帖子失败，请稍后重试');
    } finally {
        isLoading = false;
        showLoading(false);
    }
}

// 显示帖子列表
function displayPosts(posts) {
    const postList = document.getElementById('postList');
    const emptyState = document.getElementById('empty-state');
    
    if (posts.length === 0) {
        if (postList) postList.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    if (postList) {
        postList.innerHTML = posts.map(post => `
            <article class="post-item">
                <div class="post-thumbnail ${post.coverImage ? '' : 'no-image'}">
                    ${post.coverImage ? 
                        `<img src="${post.coverImage}" alt="${escapeHtml(post.title)}" onerror="this.parentElement.innerHTML='📝';">` : 
                        '📝'
                    }
                </div>
                <div class="post-content">
                    <h3 class="post-title">
                        <a href="post-detail.html?id=${post.id}">${escapeHtml(post.title)}</a>
                    </h3>
                    <p class="post-excerpt">
                        ${escapeHtml(post.summary || post.content.substring(0, 150) + '...')}
                    </p>
                    <div class="post-meta">
                        <div class="post-author">
                            <span>👤</span>
                            <span>${escapeHtml(post.authorName || '匿名用户')}</span>
                        </div>
                        <span>${formatDate(post.createdAt)}</span>
                        <span class="post-category">${escapeHtml(post.categoryName || '未分类')}</span>
                        <div class="post-stats">
                            <div class="stat-item">
                                <span>👁</span>
                                <span>${post.viewCount || 0}</span>
                            </div>
                            <div class="stat-item">
                                <span>💬</span>
                                <span>${post.commentCount || 0}</span>
                            </div>
                            <div class="stat-item">
                                <span>👍</span>
                                <span>${post.likeCount || 0}</span>
                            </div>
                        </div>
                        ${post.status !== 'PUBLISHED' ? `<span class="post-status status-${post.status.toLowerCase()}">${getPostStatusText(post.status)}</span>` : ''}
                    </div>
                </div>
            </article>
        `).join('');
    }
}

// 更新分页
function updatePagination(current, total, totalCount) {
    currentPage = current;
    totalPages = total;
    
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    if (total <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    
    let paginationHTML = '';
    
    // 上一页
    paginationHTML += `<a href="#" class="page-btn ${current === 1 ? 'disabled' : ''}" onclick="changePage(${current - 1})" ${current === 1 ? 'disabled' : ''}>上一页</a>`;
    
    // 页码
    const startPage = Math.max(1, current - 2);
    const endPage = Math.min(total, current + 2);
    
    if (startPage > 1) {
        paginationHTML += `<a href="#" class="page-btn" onclick="changePage(1)">1</a>`;
        if (startPage > 2) {
            paginationHTML += `<span class="page-ellipsis">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<a href="#" class="page-btn ${i === current ? 'active' : ''}" onclick="changePage(${i})">${i}</a>`;
    }
    
    if (endPage < total) {
        if (endPage < total - 1) {
            paginationHTML += `<span class="page-ellipsis">...</span>`;
        }
        paginationHTML += `<a href="#" class="page-btn" onclick="changePage(${total})">${total}</a>`;
    }
    
    // 下一页
    paginationHTML += `<a href="#" class="page-btn ${current === total ? 'disabled' : ''}" onclick="changePage(${current + 1})" ${current === total ? 'disabled' : ''}>下一页</a>`;
    
    pagination.innerHTML = paginationHTML;
}

// 切换页面
function changePage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    currentPage = page;
    loadPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 加载热门帖子
async function loadHotPosts() {
    try {
        const response = await postAPI.getList({
            page: 1,
            size: 5,
            sortBy: 'viewCount',
            sortOrder: 'desc',
            status: 'PUBLISHED'
        });
        
        if (response.success) {
            displayHotPosts(response.data.posts);
        }
    } catch (error) {
        console.error('加载热门帖子失败:', error);
    }
}

// 显示热门帖子
function displayHotPosts(posts) {
    const hotPosts = document.getElementById('hot-posts');
    
    if (hotPosts) {
        hotPosts.innerHTML = posts.map(post => `
            <li class="hot-post">
                <a href="post-detail.html?id=${post.id}">${escapeHtml(post.title)}</a>
                <div class="hot-post-meta">👁 ${post.viewCount || 0} | 💬 ${post.commentCount || 0}</div>
            </li>
        `).join('');
    }
}

// 加载热门标签
async function loadHotTags() {
    // 这里可以实现热门标签的API调用
    // 暂时使用静态数据
    const hotTags = ['幼崽饲养', '疾病预防', '饲料配方', '场地建设', '环境控制', '繁殖技术', '成本控制', '市场行情'];
    
    const hotTagsElement = document.getElementById('hot-tags');
    if (hotTagsElement) {
        hotTagsElement.innerHTML = hotTags.map(tag => 
            `<a href="#" class="tag" onclick="searchByTag('${tag}')">${tag}</a>`
        ).join('');
    }
}

// 加载统计信息
async function loadStats() {
    try {
        // 这里可以实现统计信息的API调用
        // 暂时使用模拟数据
        const totalPostsStat = document.getElementById('total-posts-stat');
        const todayPostsStat = document.getElementById('today-posts-stat');
        const weekPostsStat = document.getElementById('week-posts-stat');
        
        if (totalPostsStat) totalPostsStat.textContent = '0';
        if (todayPostsStat) todayPostsStat.textContent = '0';
        if (weekPostsStat) weekPostsStat.textContent = '0';
    } catch (error) {
        console.error('加载统计信息失败:', error);
    }
}

// 切换视图
function toggleView(view) {
    const postList = document.getElementById('postList');
    
    if (postList) {
        if (view === 'grid') {
            postList.classList.add('grid-view');
        } else {
            postList.classList.remove('grid-view');
        }
    }
}

// 执行搜索
function performSearch() {
    const searchInput = document.getElementById('search-input');
    const keyword = searchInput ? searchInput.value.trim() : '';
    if (keyword) {
        window.location.href = `index.html?search=${encodeURIComponent(keyword)}`;
    }
}

// 按标签搜索
function searchByTag(tag) {
    window.location.href = `index.html?search=${encodeURIComponent(tag)}`;
}

// 退出登录
function logout() {
    if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        checkLoginStatus();
        window.location.reload();
    }
}

// 显示加载状态
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
}

// 显示错误信息
function showError(message) {
    const postList = document.getElementById('postList');
    if (postList) {
        postList.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;">${message}</div>`;
    }
}

// 工具函数
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
        return '刚刚';
    } else if (diff < 3600000) {
        return Math.floor(diff / 60000) + '分钟前';
    } else if (diff < 86400000) {
        return Math.floor(diff / 3600000) + '小时前';
    } else if (diff < 2592000000) {
        return Math.floor(diff / 86400000) + '天前';
    } else {
        return date.toLocaleDateString('zh-CN');
    }
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