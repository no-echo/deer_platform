// API配置 - 统一使用/api前缀
const API_BASE_URL = 'http://localhost:8080/api';  // 基础URL，包含/api前缀

// API端点配置 - 所有路径都基于/api前缀
const API_ENDPOINTS = {
    // 用户认证 - 基于/api前缀
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REGISTER_WITH_EMAIL: '/auth/register-with-email',
    SEND_VERIFICATION_CODE: '/auth/send-verification-code',
    LOGOUT: '/auth/logout',
    CURRENT_USER: '/auth/me',
    
    // 帖子管理 - 移除重复的/api前缀
    POSTS: '/posts',
    POST_DETAIL: '/posts',
    POST_SEARCH: '/posts/search',
    POST_POPULAR: '/posts/popular',
    POST_MY: '/posts/my',
    
    // 分类管理 - 移除重复的/api前缀
    CATEGORIES: '/categories',
    CATEGORIES_ADMIN: '/categories/admin',
    CATEGORIES_STATS: '/categories/stats',
    
    // 文件上传 - 移除重复的/api前缀
    UPLOAD_AVATAR: '/files/avatar',
    UPLOAD_POST_IMAGE: '/files/post-image',
    UPLOAD_POST_IMAGES: '/files/post-images',
    DELETE_FILE: '/files',
    
    // 管理员功能 - 移除重复的/api前缀
    ADMIN_DASHBOARD_STATS: '/admin/dashboard/stats',
    ADMIN_USERS: '/admin/users',
    ADMIN_POSTS: '/admin/posts',
    ADMIN_ACTIVITIES: '/admin/activities/recent',
    ADMIN_OVERVIEW: '/admin/overview'
};

// 响应状态码
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};

// 用户角色
const USER_ROLES = {
    ADMIN: 'ADMIN',
    USER: 'USER'
};

// 帖子状态
const POST_STATUS = {
    DRAFT: 'DRAFT',
    PUBLISHED: 'PUBLISHED',
    ARCHIVED: 'ARCHIVED'
};

// 用户状态
const USER_STATUS = {
    ACTIVE: 'ACTIVE',
    BANNED: 'BANNED',
    INACTIVE: 'INACTIVE'
};

// 分类状态
const CATEGORY_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE'
};