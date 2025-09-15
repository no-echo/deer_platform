// 首页JavaScript功能模块

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
        console.log('页面DOM加载完成');
        
        try {
            // 检查登录状态
            checkLoginStatus();
            
            // 加载分类和帖子数据
            loadCategoriesAndPosts();
            
            // 初始化搜索功能
            initializeSearch();
            
            // 绑定退出登录事件
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', handleLogout);
            }
            
            console.log('页面初始化完成');
        } catch (error) {
            console.error('页面初始化失败:', error);
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
        console.log('开始加载分类和帖子数据...');
        
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
                    const htmlContent = processedPosts.data.map(post => {
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
                    postList.innerHTML = htmlContent;
                }
            }
            
            // 更新"查看更多"链接
            const moreLink = card.querySelector('.more-link a');
            if (moreLink) {
                moreLink.href = `category.html?id=${category.id}`;
            }
        }
        
        
    } catch (error) {
        console.error('加载数据失败:', error);
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
    console.log('初始化搜索功能');
    const searchInput = document.querySelector('.search-box input');
    const searchButton = document.querySelector('.search-box button');
    
    console.log('搜索输入框:', searchInput);
    console.log('搜索按钮:', searchButton);
    
    if (searchButton) {
        // 搜索按钮点击事件
        searchButton.addEventListener('click', performSearch);
        console.log('搜索按钮事件监听器已绑定');
    }
    
    if (searchInput) {
        // 回车键搜索
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        console.log('搜索输入框回车事件监听器已绑定');
    }
}

// 执行搜索
async function performSearch() {
    console.log('performSearch函数被调用');
    const searchInput = document.querySelector('.search-box input');
    const keyword = searchInput.value.trim();
    console.log('搜索关键词:', keyword);
    
    if (keyword) {
        // 搜索关键词长度验证（不进行HTML转义，避免中文字符被破坏）
        if (keyword.length < 2) {
            errorHandler.showWarning('搜索关键词至少需要2个字符');
            return;
        }
        
        // 调用搜索API并在当前页面显示结果
        console.log('开始调用searchPosts');
        await searchPosts(keyword);
    } else {
        errorHandler.showWarning('请输入搜索关键词');
    }
}

/**
 * 搜索帖子
 */
async function searchPosts(keyword, page = 0) {
    try {
        errorHandler.showLoading('正在搜索...');
        
        const response = await postAPI.search({
            keyword: keyword,
            page: page,
            size: 10
        });
        
        const processedResponse = dataProcessor.processApiResponse(response);
        
        if (processedResponse.success) {
            console.log('搜索API调用成功，准备显示结果');
            // 重构数据结构以匹配displaySearchResults的期望格式
            const searchData = {
                content: processedResponse.data,
                totalElements: processedResponse.pagination ? processedResponse.pagination.total : 0,
                totalPages: processedResponse.pagination ? processedResponse.pagination.totalPages : 0,
                number: processedResponse.pagination ? processedResponse.pagination.current - 1 : 0,
                size: processedResponse.pagination ? processedResponse.pagination.size : 10,
                last: processedResponse.pagination ? !processedResponse.pagination.hasNext : true,
                first: processedResponse.pagination ? !processedResponse.pagination.hasPrev : true
            };
            console.log('调用displaySearchResults，数据:', searchData);
            displaySearchResults(searchData, keyword);
        } else {
            throw new Error(processedResponse.message || '搜索失败');
        }
    } catch (error) {
        console.error('搜索失败:', error);
        errorHandler.showError('搜索失败: ' + error.message);
    } finally {
        errorHandler.hideLoading();
    }
}

/**
 * 显示搜索结果
 */
function displaySearchResults(searchData, keyword) {
    const mainContent = document.querySelector('.main-content');
    
    if (!mainContent) return;
    
    // 创建搜索结果容器
    const searchResultsContainer = document.createElement('div');
    searchResultsContainer.className = 'search-results-container';
    
    // 为搜索结果容器添加样式，确保在footer上方正确显示
    searchResultsContainer.style.maxWidth = '1200px';
    searchResultsContainer.style.margin = '2rem auto';
    searchResultsContainer.style.padding = '2rem';
    searchResultsContainer.style.backgroundColor = 'var(--bg-color)';
    searchResultsContainer.style.flex = '1';
    searchResultsContainer.style.display = 'flex';
    searchResultsContainer.style.flexDirection = 'column';
    searchResultsContainer.style.minHeight = 'calc(100vh - 200px)';
    searchResultsContainer.style.borderRadius = '8px';
    searchResultsContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    
    // 创建返回首页按钮
    const backButton = document.createElement('button');
    backButton.className = 'btn btn-secondary back-to-home';
    backButton.textContent = '← 返回首页';
    backButton.style.marginBottom = '20px';
    backButton.addEventListener('click', clearSearch);
    searchResultsContainer.appendChild(backButton);
    
    // 创建搜索结果标题和内容
    searchResultsContainer.innerHTML += `
        <div class="search-results-header">
            <h2>搜索结果: "${dataProcessor.escapeHtml(keyword)}"</h2>
            <p>共找到 ${searchData.totalElements || 0} 个结果</p>
        </div>
        <div class="search-results-content"></div>
    `;
    
    const resultsContent = searchResultsContainer.querySelector('.search-results-content');
    
    if (searchData.content && searchData.content.length > 0) {
        // 显示搜索结果
        searchData.content.forEach(post => {
            const formattedPost = dataProcessor.formatPostForDisplay(post);
            const postElement = document.createElement('div');
            postElement.className = 'search-result-item';
            postElement.innerHTML = `
                <div class="post-item">
                    <h3><a href="post-detail.html?id=${formattedPost.id}" class="post-title">${formattedPost.title}</a></h3>
                    <div class="post-meta">
                        <span class="post-time">${formattedPost.formattedTime}</span>
                        <span class="post-author">作者: ${formattedPost.author.nickname}</span>
                    </div>
                    <div class="post-excerpt">${formattedPost.summary || ''}</div>
                </div>
            `;
            resultsContent.appendChild(postElement);
        });
        
        // 添加分页
        if (searchData.totalPages > 1) {
            const pagination = createSearchPagination(searchData, keyword);
            resultsContent.appendChild(pagination);
        }
    } else {
        resultsContent.innerHTML = '<div class="no-results"><p>没有找到相关帖子</p></div>';
    }
    
    // 移除之前的搜索结果（可能在body中或main中）
    const existingResults = document.querySelector('.search-results-container');
    if (existingResults) {
        existingResults.remove();
        console.log('已移除之前的搜索结果容器');
    }
    
    // 然后隐藏原有内容，显示搜索结果
    console.log('开始隐藏原有内容');
    
    // 直接隐藏section和main元素
    const bannerSection = document.querySelector('section.banner');
    if (bannerSection) {
        bannerSection.style.display = 'none';
        console.log('已隐藏banner section元素');
    }
    
    // 完全隐藏main元素，然后将搜索结果容器插入到footer之前
    const mainElement = document.querySelector('main.main-content');
    const footerElement = document.querySelector('footer.footer');
    
    if (mainElement) {
        mainElement.style.display = 'none';
        console.log('已完全隐藏main元素');
        
        // 将搜索结果容器插入到footer之前
        if (footerElement) {
            document.body.insertBefore(searchResultsContainer, footerElement);
            console.log('搜索结果容器已插入到footer之前');
        } else {
            document.body.appendChild(searchResultsContainer);
            console.log('未找到footer，搜索结果容器已添加到body末尾');
        }
    } else {
        // 如果找不到main元素，仍然添加到mainContent
        mainContent.appendChild(searchResultsContainer);
    }
    
    // 隐藏搜索按钮
    const searchButton = document.querySelector('.search-box button');
    if (searchButton) {
        searchButton.style.display = 'none';
        console.log('已隐藏搜索按钮');
    }
}

/**
 * 创建搜索分页
 */
function createSearchPagination(searchData, keyword) {
    const pagination = document.createElement('div');
    pagination.className = 'pagination';
    
    let paginationHTML = '';
    
    // 上一页
    if (searchData.number > 0) {
        paginationHTML += `<button onclick="searchPosts('${dataProcessor.escapeHtml(keyword)}', ${searchData.number - 1})" class="btn btn-outline-primary">上一页</button>`;
    }
    
    // 页码
    const startPage = Math.max(0, searchData.number - 2);
    const endPage = Math.min(searchData.totalPages - 1, searchData.number + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === searchData.number ? 'active' : '';
        paginationHTML += `<button onclick="searchPosts('${dataProcessor.escapeHtml(keyword)}', ${i})" class="btn btn-outline-primary ${isActive}">${i + 1}</button>`;
    }
    
    // 下一页
    if (searchData.number < searchData.totalPages - 1) {
        paginationHTML += `<button onclick="searchPosts('${dataProcessor.escapeHtml(keyword)}', ${searchData.number + 1})" class="btn btn-outline-primary">下一页</button>`;
    }
    
    pagination.innerHTML = paginationHTML;
    return pagination;
}

/**
 * 清除搜索结果，返回首页
 */
function clearSearch() {
    // 移除搜索结果容器（可能在body中或main中）
    const searchResultsContainer = document.querySelector('.search-results-container');
    if (searchResultsContainer) {
        searchResultsContainer.remove();
        console.log('已移除搜索结果容器');
    }
    
    // 显示原有内容
    // 重新显示banner section元素
    const bannerSection = document.querySelector('section.banner');
    if (bannerSection) {
        bannerSection.style.display = 'block';
        console.log('已重新显示banner section');
    }
    
    // 重新显示main元素
    const mainElement = document.querySelector('main.main-content');
    if (mainElement) {
        mainElement.style.display = 'block';
        console.log('已重新显示main元素');
    }
    
    // 清空搜索框
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // 重新显示搜索按钮
    const searchButton = document.querySelector('.search-box button');
    if (searchButton) {
        searchButton.style.display = 'block';
        console.log('已重新显示搜索按钮');
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