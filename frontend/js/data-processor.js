// 数据处理工具类
class DataProcessor {
    // 验证和清理用户输入数据
    static sanitizeInput(data) {
        const sanitized = {};
        
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string') {
                // 去除首尾空格
                sanitized[key] = value.trim();
                
                // HTML转义防止XSS
                sanitized[key] = this.escapeHtml(sanitized[key]);
            } else {
                sanitized[key] = value;
            }
        }
        
        return sanitized;
    }
    
    // HTML转义
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 验证帖子数据
    static validatePostData(data) {
        const errors = {};
        
        // 标题验证
        if (!data.title || data.title.length < 5) {
            errors.title = '标题至少需要5个字符';
        } else if (data.title.length > 100) {
            errors.title = '标题不能超过100个字符';
        }
        
        // 内容验证
        if (!data.content || data.content.length < 10) {
            errors.content = '内容至少需要10个字符';
        } else if (data.content.length > 10000) {
            errors.content = '内容不能超过10000个字符';
        }
        
        // 分类验证
        if (!data.categoryId) {
            errors.categoryId = '请选择分类';
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
    
    // 验证用户资料数据
    static validateUserProfileData(data) {
        const errors = {};
        
        // 昵称验证
        if (data.nickname && (data.nickname.length < 2 || data.nickname.length > 20)) {
            errors.nickname = '昵称长度应在2-20个字符之间';
        }
        
        // 邮箱验证
        if (data.email && !this.isValidEmail(data.email)) {
            errors.email = '请输入有效的邮箱地址';
        }
        
        // 个人简介验证
        if (data.bio && data.bio.length > 500) {
            errors.bio = '个人简介不能超过500个字符';
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
    
    // 邮箱格式验证
    static isValidEmail(email) {
        const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        return emailRegex.test(email);
    }
    
    // 处理后端响应数据
    static processApiResponse(response) {
        try {
            // 标准化响应格式
            const standardResponse = {
                success: response.success || false,
                message: response.message || '',
                data: response.data || null,
                errors: response.errors || {},
                timestamp: response.timestamp || new Date().toISOString()
            };
            
            // 处理分页数据
            if (response.data && response.data.content) {
                standardResponse.pagination = {
                    current: response.data.number + 1,
                    size: response.data.size,
                    total: response.data.totalElements,
                    totalPages: response.data.totalPages,
                    hasNext: !response.data.last,
                    hasPrev: !response.data.first
                };
                standardResponse.data = response.data.content;
            }
            
            return standardResponse;
        } catch (error) {
            console.error('响应数据处理失败:', error);
            return {
                success: false,
                message: '数据处理失败',
                data: null,
                errors: {},
                timestamp: new Date().toISOString()
            };
        }
    }
    
    // 格式化帖子数据用于显示
    static formatPostForDisplay(post) {
        return {
            id: post.id,
            title: this.escapeHtml(post.title),
            content: this.escapeHtml(post.content),
            summary: this.generateSummary(post.content),
            author: {
                id: post.author?.id,
                username: this.escapeHtml(post.author?.username || ''),
                nickname: this.escapeHtml(post.author?.nickname || post.author?.username || ''),
                avatar: post.author?.avatar || '/images/default-avatar.png'
            },
            category: {
                id: post.category?.id,
                name: this.escapeHtml(post.category?.name || ''),
                slug: post.category?.slug || ''
            },
            stats: {
                views: post.views || 0,
                likes: post.likes || 0,
                comments: post.comments || 0
            },
            status: post.status || 'PUBLISHED',
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            formattedTime: this.formatTime(post.createdAt)
        };
    }
    
    // 生成内容摘要
    static generateSummary(content, maxLength = 150) {
        if (!content) return '';
        
        // 移除HTML标签
        const textContent = content.replace(/<[^>]*>/g, '');
        
        if (textContent.length <= maxLength) {
            return textContent;
        }
        
        return textContent.substring(0, maxLength) + '...';
    }
    
    // 格式化时间
    static formatTime(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (minutes < 1) {
            return '刚刚';
        } else if (minutes < 60) {
            return `${minutes}分钟前`;
        } else if (hours < 24) {
            return `${hours}小时前`;
        } else if (days < 7) {
            return `${days}天前`;
        } else {
            return date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }
    
    // 格式化文件大小
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // 验证图片文件
    static validateImageFile(file) {
        const errors = [];
        
        // 检查文件类型
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            errors.push('只支持 JPG、PNG、GIF 格式的图片');
        }
        
        // 检查文件大小 (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            errors.push('图片大小不能超过 5MB');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    // 深度克隆对象
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }
        
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        
        return cloned;
    }
}

// 导出数据处理器
window.dataProcessor = DataProcessor;