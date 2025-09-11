// API请求工具类
class ApiClient {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('token');
    }
    
    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            console.log('API请求URL:', url); // 调试日志
            
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            };
            
            // 添加认证token
            const token = localStorage.getItem('token');
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(url, config);
            
            // 检查响应类型
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('服务器返回非JSON响应:', text);
                throw new Error('服务器响应格式错误，请检查后端服务是否正常运行');
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API请求失败:', error);
            if (errorHandler) {
                errorHandler.handleApiError(error);
            }
            throw error;
        }
    }
    
    // 文件上传请求
    async uploadFile(endpoint, formData) {
        const url = this.baseURL + endpoint;
        const config = {
            method: 'POST',
            headers: {},
            body: formData
        };
        
        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const error = new Error(errorData.message || `上传失败: HTTP ${response.status}`);
                error.status = response.status;
                throw error;
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.handleApiError(error, `文件上传 ${endpoint}`);
            } else {
                console.error('文件上传错误:', error);
            }
            throw error;
        }
    }
    
    // GET请求
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }
    
    // POST请求
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    // PUT请求
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    // DELETE请求
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
    
    // 更新token
    updateToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }
}

// 创建全局API客户端实例
const apiClient = new ApiClient();

// 认证相关API
const authAPI = {
    // 用户登录
    login: async (username, password) => {
        const response = await apiClient.post(API_ENDPOINTS.LOGIN, { username, password });
        if (response.success && response.data.token) {
            apiClient.updateToken(response.data.token);
            // 保存用户信息
            localStorage.setItem('user', JSON.stringify(response.data.user));
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', response.data.user.username);
            localStorage.setItem('nickname', response.data.user.nickname || response.data.user.username);
            localStorage.setItem('userRole', response.data.user.role);
        }
        return response;
    },
    
    // 用户注册
    register: async (userData) => {
        return await apiClient.post(API_ENDPOINTS.REGISTER, userData);
    },
    
    // 邮箱注册
    registerWithEmail: async (userData) => {
        return await apiClient.request(API_ENDPOINTS.REGISTER_WITH_EMAIL, {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },
    
    // 发送注册验证码
    sendVerificationCode: async (email) => {
        const params = new URLSearchParams({ email });
        return await apiClient.request(API_ENDPOINTS.SEND_VERIFICATION_CODE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });
    },
    
    // 发送密码重置验证码
    sendPasswordResetCode: async (email) => {
        const params = new URLSearchParams({ email });
        return await apiClient.request('/auth/send-reset-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });
    },
    
    // 重置密码
    resetPassword: async (data) => {
        const params = new URLSearchParams({
            email: data.email,
            newPassword: data.newPassword,
            confirmPassword: data.confirmPassword,
            verificationCode: data.verificationCode
        });
        return await apiClient.request('/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });
    },
    
    // 用户退出
    logout: async () => {
        try {
            await apiClient.post(API_ENDPOINTS.LOGOUT);
        } finally {
            // 清除本地存储
            apiClient.updateToken(null);
            localStorage.removeItem('user');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('username');
            localStorage.removeItem('nickname');
            localStorage.removeItem('userRole');
        }
    },
    
    // 获取当前用户信息
    getCurrentUser: async () => {
        return await apiClient.get(API_ENDPOINTS.CURRENT_USER);
    }
};

// 帖子相关API
const postAPI = {
    // 创建帖子
    create: async (postData) => {
        return await apiClient.post(API_ENDPOINTS.POSTS, postData);
    },
    
    // 获取帖子列表
    getList: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.categoryId) queryParams.append('categoryId', params.categoryId);
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.page !== undefined) queryParams.append('page', params.page);
        if (params.size !== undefined) queryParams.append('size', params.size);
        
        const queryString = queryParams.toString();
        return await apiClient.get(`${API_ENDPOINTS.POSTS}${queryString ? '?' + queryString : ''}`);
    },
    
    // 获取帖子详情
    getById: async (id) => {
        return await apiClient.get(`${API_ENDPOINTS.POST_DETAIL}/${id}`);
    },
    
    // 更新帖子
    update: async (id, postData) => {
        return await apiClient.put(`${API_ENDPOINTS.POSTS}/${id}`, postData);
    },
    
    // 删除帖子
    delete: async (id) => {
        return await apiClient.delete(`${API_ENDPOINTS.POSTS}/${id}`);
    },
    
    // 搜索帖子
    search: async (keyword, page = 0, size = 10) => {
        const params = new URLSearchParams({ keyword, page, size });
        return await apiClient.get(`${API_ENDPOINTS.POST_SEARCH}?${params}`);
    },
    
    // 获取热门帖子
    getPopular: async (page = 0, size = 10) => {
        const params = new URLSearchParams({ page, size });
        return await apiClient.get(`${API_ENDPOINTS.POST_POPULAR}?${params}`);
    },
    
    // 获取我的帖子
    getMy: async (page = 0, size = 10) => {
        const params = new URLSearchParams({ page, size });
        return await apiClient.get(`${API_ENDPOINTS.POST_MY}?${params}`);
    }
};

// 分类相关API
const categoryAPI = {
    // 获取所有激活分类
    getAll: async () => {
        return await apiClient.get(API_ENDPOINTS.CATEGORIES);
    },
    
    // 获取分类详情
    getById: async (id) => {
        return await apiClient.get(`${API_ENDPOINTS.CATEGORIES}/${id}`);
    },
    
    // 创建分类（管理员）
    create: async (name, description, icon) => {
        const params = new URLSearchParams({ name });
        if (description) params.append('description', description);
        if (icon) params.append('icon', icon);
        
        return await apiClient.request(API_ENDPOINTS.CATEGORIES, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });
    },
    
    // 更新分类（管理员）
    update: async (id, name, description, icon) => {
        const params = new URLSearchParams({ name });
        if (description) params.append('description', description);
        if (icon) params.append('icon', icon);
        
        return await apiClient.request(`${API_ENDPOINTS.CATEGORIES}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });
    },
    
    // 删除分类（管理员）
    delete: async (id) => {
        return await apiClient.delete(`${API_ENDPOINTS.CATEGORIES}/${id}`);
    },
    
    // 获取管理员分类列表
    getAdminList: async (status = 'ACTIVE', page = 0, size = 10) => {
        const params = new URLSearchParams({ status, page, size });
        return await apiClient.get(`${API_ENDPOINTS.CATEGORIES_ADMIN}?${params}`);
    },
    
    // 更新分类排序
    updateSort: async (id, sortOrder) => {
        const params = new URLSearchParams({ sortOrder });
        return await apiClient.request(`${API_ENDPOINTS.CATEGORIES}/${id}/sort`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });
    },
    
    // 获取分类统计
    getStats: async () => {
        return await apiClient.get(API_ENDPOINTS.CATEGORIES_STATS);
    }
};

// 文件上传相关API
// 用户资料相关API
const userAPI = {
    // 获取用户资料
    getProfile: async () => {
        return await apiClient.get(API_ENDPOINTS.USER_PROFILE);
    },
    
    // 更新用户资料
    updateProfile: async (profileData) => {
        return await apiClient.put(API_ENDPOINTS.UPDATE_USER_PROFILE, profileData);
    },
    
    // 修改密码
    changePassword: async (passwordData) => {
        return await apiClient.put(API_ENDPOINTS.CHANGE_PASSWORD, passwordData);
    },
    
    // 获取用户发布的帖子
    getPosts: async (page = 0, size = 10) => {
        const username = localStorage.getItem('username');
        return await apiClient.get(`/user/${username}/posts?page=${page}&size=${size}`);
    },
    
    // 获取用户收藏的帖子
    getCollections: async (page = 0, size = 10) => {
        const username = localStorage.getItem('username');
        return await apiClient.get(`/user/${username}/collections?page=${page}&size=${size}`);
    },
    
    // 获取用户统计信息
    getStats: async () => {
        const username = localStorage.getItem('username');
        return await apiClient.get(`/user/${username}/stats`);
    }
};

const fileAPI = {
    // 上传头像
    uploadAvatar: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return await apiClient.uploadFile(API_ENDPOINTS.UPLOAD_AVATAR, formData);
    },
    
    // 上传帖子图片
    uploadPostImage: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return await apiClient.uploadFile(API_ENDPOINTS.UPLOAD_POST_IMAGE, formData);
    },
    
    // 批量上传帖子图片
    uploadPostImages: async (files) => {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        return await apiClient.uploadFile(API_ENDPOINTS.UPLOAD_POST_IMAGES, formData);
    },
    
    // 删除文件
    delete: async (filePath) => {
        const params = new URLSearchParams({ path: filePath });
        return await apiClient.delete(`${API_ENDPOINTS.DELETE_FILE}?${params}`);
    }
};

// 管理员相关API
const adminAPI = {
    // 获取仪表板统计数据
    getDashboardStats: async () => {
        return await apiClient.get(API_ENDPOINTS.ADMIN_DASHBOARD_STATS);
    },
    
    // 获取用户列表
    getUsers: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page !== undefined) queryParams.append('page', params.page);
        if (params.size !== undefined) queryParams.append('size', params.size);
        if (params.status) queryParams.append('status', params.status);
        if (params.keyword) queryParams.append('keyword', params.keyword);
        
        const queryString = queryParams.toString();
        return await apiClient.get(`${API_ENDPOINTS.ADMIN_USERS}${queryString ? '?' + queryString : ''}`);
    },
    
    // 更新用户状态
    updateUserStatus: async (userId, status) => {
        const params = new URLSearchParams({ status });
        return await apiClient.request(`${API_ENDPOINTS.ADMIN_USERS}/${userId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });
    },
    
    // 获取帖子列表
    getPosts: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page !== undefined) queryParams.append('page', params.page);
        if (params.size !== undefined) queryParams.append('size', params.size);
        if (params.status) queryParams.append('status', params.status);
        if (params.keyword) queryParams.append('keyword', params.keyword);
        if (params.categoryId) queryParams.append('categoryId', params.categoryId);
        
        const queryString = queryParams.toString();
        return await apiClient.get(`${API_ENDPOINTS.ADMIN_POSTS}${queryString ? '?' + queryString : ''}`);
    },
    
    // 更新帖子状态
    updatePostStatus: async (postId, status) => {
        const params = new URLSearchParams({ status });
        return await apiClient.request(`${API_ENDPOINTS.ADMIN_POSTS}/${postId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });
    },
    
    // 删除帖子
    deletePost: async (postId) => {
        return await apiClient.delete(`${API_ENDPOINTS.ADMIN_POSTS}/${postId}`);
    },
    
    // 获取最新活动
    getRecentActivities: async (page = 0, size = 10) => {
        const params = new URLSearchParams({ page, size });
        return await apiClient.get(`${API_ENDPOINTS.ADMIN_ACTIVITIES}?${params}`);
    },
    
    // 获取系统概览
    getOverview: async () => {
        return await apiClient.get(API_ENDPOINTS.ADMIN_OVERVIEW);
    }
};

// 导出API对象
window.authAPI = authAPI;
window.postAPI = postAPI;
window.categoryAPI = categoryAPI;
window.userAPI = userAPI;
window.fileAPI = fileAPI;
window.adminAPI = adminAPI;
window.apiClient = apiClient;