// 帖子详情页JavaScript功能模块

let currentPost = null;
let currentUser = null;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    if (!postId) {
        alert('帖子ID不存在');
        window.location.href = 'index.html';
        return;
    }
    
    checkLoginStatus();
    loadPostDetail(postId);
    initializeInteractions();
});

// 检查登录状态
async function checkLoginStatus() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            currentUser = await authAPI.getCurrentUser();
        } catch (error) {
            console.error('获取用户信息失败:', error);
            // 用户未登录或token过期，清除本地存储
            localStorage.removeItem('token');
            localStorage.removeItem('isLoggedIn');
        }
    }
}

// 加载帖子详情
async function loadPostDetail(postId) {
    try {
        const response = await postAPI.getById(postId);
        
        // 检查API响应格式
        if (response && response.success && response.data) {
            currentPost = response.data;
        } else {
            throw new Error(response.message || '获取帖子数据失败');
        }
        
        // 更新页面标题
        document.title = `${currentPost.title} - 林麝养殖交流分享平台`;
        
        // 更新面包屑导航
        updateBreadcrumb();
        
        // 更新帖子内容
        updatePostContent();
        
        // 更新作者信息
        updateAuthorInfo();
        
        // 更新用户头像和导航
        updateUserNavigation();
        
        // 获取帖子状态（点赞和收藏状态）
        const postStatus = await getPostStatus(postId);
        currentPost.isLiked = postStatus.isLiked;
        currentPost.isFavorited = postStatus.isFavorited;
        
        // 更新操作按钮
        updatePostActions();
        
        // 加载相关推荐
        loadRelatedPosts();
        
    } catch (error) {
        console.error('加载帖子详情失败:', error);
        alert('帖子不存在或已被删除');
        window.location.href = 'index.html';
    }
}

// 更新面包屑导航
function updateBreadcrumb() {
    const breadcrumb = document.querySelector('.breadcrumb-container');
    if (breadcrumb && currentPost.category) {
        breadcrumb.innerHTML = `
            <a href="index.html">首页</a> > 
            <a href="category.html?id=${currentPost.category.id}">${escapeHtml(currentPost.category.name)}</a> > 
            <span>${escapeHtml(currentPost.title)}</span>
        `;
    }
}

// 更新帖子内容
function updatePostContent() {
    // 更新标题
    const titleElement = document.querySelector('.post-title');
    if (titleElement) {
        titleElement.textContent = currentPost.title;
    }
    
    // 更新元信息
    const metaElement = document.querySelector('.post-meta');
    if (metaElement) {
        metaElement.innerHTML = `
            <div class="author-info">
                <div class="avatar">${currentPost.author.nickname.charAt(0)}</div>
                <span>${escapeHtml(currentPost.author.nickname)}</span>
            </div>
            <span>发布时间：${formatDateTime(currentPost.createdAt)}</span>
            <span>分类：${escapeHtml(currentPost.category.name)}</span>
            <span>阅读：${currentPost.viewCount || 0}</span>
        `;
    }
    
    // 更新内容
    const bodyElement = document.querySelector('.post-body');
    if (bodyElement) {
        bodyElement.innerHTML = formatPostContent(currentPost.content);
    }
    
    // 更新操作按钮
    updatePostActions();
    
    // 显示编辑删除按钮（如果是作者或管理员）
    showEditDeleteButtons();
}

// 更新帖子操作按钮
function updatePostActions() {
    const actionsElement = document.querySelector('.post-actions');
    if (actionsElement) {
        const likeClass = currentPost.isLiked ? 'action-btn active' : 'action-btn';
        const favoriteClass = currentPost.isFavorited ? 'action-btn active' : 'action-btn';
        const likeText = currentPost.isLiked ? '已点赞' : '点赞';
        const favoriteText = currentPost.isFavorited ? '已收藏' : '收藏';
        
        actionsElement.innerHTML = `
            <button class="${likeClass}" id="likeBtn" onclick="toggleLike()">
                <span>👍</span>
                <span>${likeText} (${currentPost.likeCount || 0})</span>
            </button>
            <button class="${favoriteClass}" id="favoriteBtn" onclick="toggleFavorite()">
                <span>⭐</span>
                <span>${favoriteText} (${currentPost.favoriteCount || 0})</span>
            </button>
            <button class="action-btn" onclick="sharePost()">
                <span>📤</span>
                <span>分享</span>
            </button>
        `;
    }
}

// 显示编辑删除按钮
function showEditDeleteButtons() {
    if (currentUser && (currentUser.id === currentPost.author.id || currentUser.role === 'ADMIN')) {
        const actionsElement = document.querySelector('.post-actions');
        if (actionsElement) {
            actionsElement.innerHTML += `
                <button class="action-btn edit-btn" onclick="editPost()" style="background-color: #28a745; color: white;">
                    <span>✏️</span>
                    <span>编辑</span>
                </button>
                <button class="action-btn delete-btn" onclick="deletePost()" style="background-color: #dc3545; color: white;">
                    <span>🗑️</span>
                    <span>删除</span>
                </button>
            `;
        }
    }
}

// 更新作者信息
function updateAuthorInfo() {
    const authorCard = document.querySelector('.author-card');
    if (authorCard && currentPost.author) {
        const author = currentPost.author;
        authorCard.innerHTML = `
            <div class="author-avatar">${author.nickname.charAt(0)}</div>
            <div class="author-name">${escapeHtml(author.nickname)}</div>
            <div class="author-bio">${escapeHtml(author.bio || '这个用户很懒，什么都没有留下')}</div>
            ${currentUser && currentUser.id !== author.id ? '<button class="follow-btn" onclick="followAuthor()">关注作者</button>' : ''}
        `;
    }
}

// 更新用户导航
function updateUserNavigation() {
    const userInfo = document.querySelector('.user-info');
    if (userInfo) {
        if (currentUser) {
            userInfo.innerHTML = `
                <span>欢迎，${escapeHtml(currentUser.nickname)}</span>
                <a href="user-center.html" style="color: white; margin-left: 1rem;">个人中心</a>
                <button onclick="logout()" style="color: white; margin-left: 1rem; background: none; border: none; cursor: pointer;">退出</button>
            `;
        } else {
            userInfo.innerHTML = `
                <a href="login.html" style="color: white; margin-right: 1rem;">登录</a>
                <a href="register.html" style="color: white;">注册</a>
            `;
        }
    }
}

// 加载相关推荐
async function loadRelatedPosts() {
    try {
        const relatedPosts = await postAPI.getList({
            categoryId: currentPost.category.id,
            page: 0,
            size: 5
        });
        
        const relatedList = document.querySelector('.related-posts');
        if (relatedList && relatedPosts.content) {
            relatedList.innerHTML = relatedPosts.content
                .filter(post => post.id !== currentPost.id)
                .slice(0, 5)
                .map(post => `
                    <li><a href="post-detail.html?id=${post.id}">${escapeHtml(post.title)}</a></li>
                `).join('');
        }
    } catch (error) {
        console.error('加载相关推荐失败:', error);
    }
}

// 初始化交互功能
function initializeInteractions() {
    // 评论表单提交
    const commentForm = document.querySelector('.comment-form');
    if (commentForm) {
        const textarea = commentForm.querySelector('textarea');
        const submitBtn = commentForm.querySelector('button');
        
        submitBtn.addEventListener('click', async function() {
            const content = textarea.value.trim();
            if (!content) {
                alert('请输入评论内容');
                return;
            }
            
            if (!currentUser) {
                alert('请先登录');
                window.location.href = 'login.html';
                return;
            }
            
            try {
                // 这里需要实现评论API
                // await commentAPI.create(currentPost.id, content);
                alert('评论功能开发中...');
                textarea.value = '';
            } catch (error) {
                alert('评论失败: ' + error.message);
            }
        });
    }
}

// 点赞功能
async function toggleLike() {
    if (!currentUser) {
        alert('请先登录');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await postAPI.toggleLike(currentPost.id);
        if (response.success) {
            // 更新点赞状态
            currentPost.isLiked = response.data.isLiked;
            // 重新获取帖子状态以更新计数
            const statusResponse = await postAPI.getStatus(currentPost.id);
            if (statusResponse.success) {
                currentPost.likeCount = statusResponse.data.likeCount;
            }
            updatePostActions();
        } else {
            alert('操作失败: ' + (response.message || '未知错误'));
        }
    } catch (error) {
        console.error('点赞操作失败:', error);
        alert('操作失败: ' + error.message);
    }
}

// 收藏功能
async function toggleFavorite() {
    if (!currentUser) {
        alert('请先登录');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await postAPI.toggleFavorite(currentPost.id);
        if (response.success) {
            // 更新收藏状态
            currentPost.isFavorited = response.data.isFavorited;
            // 重新获取帖子状态以更新计数
            const statusResponse = await postAPI.getStatus(currentPost.id);
            if (statusResponse.success) {
                currentPost.favoriteCount = statusResponse.data.favoriteCount;
            }
            updatePostActions();
        } else {
            alert('操作失败: ' + (response.message || '未知错误'));
        }
    } catch (error) {
        console.error('收藏操作失败:', error);
        alert('操作失败: ' + error.message);
    }
}

// 获取帖子状态（点赞和收藏状态）
async function getPostStatus(postId) {
    if (!currentUser) {
        return { isLiked: false, isFavorited: false };
    }
    
    try {
        const response = await postAPI.getStatus(postId);
        if (response.success) {
            return response.data;
        } else {
            console.error('获取帖子状态失败:', response.message);
            return { isLiked: false, isFavorited: false };
        }
    } catch (error) {
        console.error('获取帖子状态失败:', error);
        return { isLiked: false, isFavorited: false };
    }
}

// 分享功能
function sharePost() {
    if (navigator.share) {
        navigator.share({
            title: currentPost.title,
            text: currentPost.content.substring(0, 100) + '...',
            url: window.location.href
        });
    } else {
        // 复制链接到剪贴板
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('链接已复制到剪贴板');
        }).catch(() => {
            alert('分享链接: ' + window.location.href);
        });
    }
}

// 编辑帖子
function editPost() {
    window.location.href = `create-post.html?edit=${currentPost.id}`;
}

// 删除帖子
async function deletePost() {
    if (!confirm('确定要删除这篇帖子吗？删除后无法恢复。')) {
        return;
    }
    
    try {
        await postAPI.delete(currentPost.id);
        alert('帖子已删除');
        window.location.href = 'index.html';
    } catch (error) {
        alert('删除失败: ' + error.message);
    }
}

// 关注作者
async function followAuthor() {
    if (!currentUser) {
        alert('请先登录');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        // 这里需要实现关注API
        alert('关注功能开发中...');
    } catch (error) {
        alert('操作失败: ' + error.message);
    }
}

// 退出登录
async function logout() {
    if (confirm('确定要退出登录吗？')) {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('登出API调用失败:', error);
        }
        
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        localStorage.removeItem('nickname');
        
        window.location.reload();
    }
}

// 工具函数：HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 工具函数：格式化日期时间
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 工具函数：格式化帖子内容
function formatPostContent(content) {
    // 简单的Markdown渲染
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
        .replace(/\n- /g, '<br>• ')
        .replace(/\n/g, '<br>');
}