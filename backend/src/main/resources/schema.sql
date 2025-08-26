-- 创建数据库
CREATE DATABASE IF NOT EXISTS deer_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE deer_platform;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    email VARCHAR(100) UNIQUE NOT NULL COMMENT '邮箱',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    nickname VARCHAR(50) COMMENT '昵称',
    avatar_url VARCHAR(255) COMMENT '头像URL',
    bio TEXT COMMENT '个人简介',
    role ENUM('USER', 'ADMIN') DEFAULT 'USER' COMMENT '用户角色',
    status ENUM('ACTIVE', 'INACTIVE', 'BANNED') DEFAULT 'ACTIVE' COMMENT '用户状态',
    email_verified BOOLEAN DEFAULT FALSE COMMENT '邮箱是否验证',
    last_login_time TIMESTAMP NULL COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
);

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL COMMENT '分类名称',
    description TEXT COMMENT '分类描述',
    icon VARCHAR(100) COMMENT '分类图标',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
);

-- 帖子表
CREATE TABLE IF NOT EXISTS posts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL COMMENT '标题',
    content LONGTEXT NOT NULL COMMENT '内容',
    summary VARCHAR(500) COMMENT '摘要',
    cover_image VARCHAR(255) COMMENT '封面图片',
    category_id BIGINT NOT NULL COMMENT '分类ID',
    author_id BIGINT NOT NULL COMMENT '作者ID',
    view_count INT DEFAULT 0 COMMENT '浏览次数',
    like_count INT DEFAULT 0 COMMENT '点赞次数',
    comment_count INT DEFAULT 0 COMMENT '评论次数',
    status ENUM('DRAFT', 'PUBLISHED', 'HIDDEN', 'DELETED') DEFAULT 'PUBLISHED' COMMENT '状态',
    is_top BOOLEAN DEFAULT FALSE COMMENT '是否置顶',
    allow_comment BOOLEAN DEFAULT TRUE COMMENT '是否允许评论',
    tags VARCHAR(500) COMMENT '标签，逗号分隔',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (author_id) REFERENCES users(id),
    INDEX idx_category_id (category_id),
    INDEX idx_author_id (author_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL COMMENT '帖子ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    parent_id BIGINT NULL COMMENT '父评论ID',
    content TEXT NOT NULL COMMENT '评论内容',
    like_count INT DEFAULT 0 COMMENT '点赞次数',
    status ENUM('ACTIVE', 'HIDDEN', 'DELETED') DEFAULT 'ACTIVE' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES comments(id),
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id),
    INDEX idx_parent_id (parent_id)
);

-- 用户收藏表
CREATE TABLE IF NOT EXISTS user_favorites (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    post_id BIGINT NOT NULL COMMENT '帖子ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (post_id) REFERENCES posts(id),
    UNIQUE KEY uk_user_post (user_id, post_id)
);

-- 用户点赞表
CREATE TABLE IF NOT EXISTS user_likes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    target_id BIGINT NOT NULL COMMENT '目标ID（帖子或评论）',
    target_type ENUM('POST', 'COMMENT') NOT NULL COMMENT '目标类型',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY uk_user_target (user_id, target_id, target_type)
);

-- 插入默认分类数据
INSERT INTO categories (name, description, icon, sort_order) VALUES
('经验分享', '分享您的林麝养殖实践经验，与同行交流心得体会', '🤝', 1),
('科学养殖', '探讨科学的林麝养殖技术和方法', '🔬', 2),
('饲养饲料', '林麝饲料配方、营养需求等相关讨论', '🌾', 3),
('疾病控制', '林麝常见疾病预防、治疗经验分享', '🏥', 4);

-- 插入管理员用户
INSERT INTO users (username, email, password_hash, nickname, role, email_verified) VALUES
('admin', 'admin@deerplatform.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lbdOIwk9q5fJ2kw7m', '管理员', 'ADMIN', TRUE);
-- 密码是: admin123


-- 在现有表后添加以下表结构

-- 用户关注表（产品需求中的关注功能）
CREATE TABLE IF NOT EXISTS user_follows (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    follower_id BIGINT NOT NULL COMMENT '关注者ID',
    following_id BIGINT NOT NULL COMMENT '被关注者ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_follow (follower_id, following_id),
    INDEX idx_follower_id (follower_id),
    INDEX idx_following_id (following_id)
) COMMENT='用户关注表';

-- 标签表（产品需求中提到的标签系统）
CREATE TABLE IF NOT EXISTS tags (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE COMMENT '标签名称',
    description TEXT COMMENT '标签描述',
    use_count INT DEFAULT 0 COMMENT '使用次数',
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_name (name),
    INDEX idx_use_count (use_count)
) COMMENT='标签表';

-- 帖子标签关联表
CREATE TABLE IF NOT EXISTS post_tags (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL COMMENT '帖子ID',
    tag_id BIGINT NOT NULL COMMENT '标签ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE KEY uk_post_tag (post_id, tag_id),
    INDEX idx_post_id (post_id),
    INDEX idx_tag_id (tag_id)
) COMMENT='帖子标签关联表';

-- VIP用户表（产品需求中的VIP订阅功能）
CREATE TABLE IF NOT EXISTS user_vip (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    vip_type ENUM('ANNUAL') NOT NULL COMMENT 'VIP类型',
    start_date DATE NOT NULL COMMENT '开始日期',
    end_date DATE NOT NULL COMMENT '结束日期',
    status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE' COMMENT '状态',
    payment_amount DECIMAL(10,2) COMMENT '支付金额',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_end_date (end_date)
) COMMENT='VIP用户表';

-- 内容审核表（产品需求中的审核机制）
CREATE TABLE IF NOT EXISTS content_audit (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    content_type ENUM('POST', 'COMMENT') NOT NULL COMMENT '内容类型',
    content_id BIGINT NOT NULL COMMENT '内容ID',
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING' COMMENT '审核状态',
    auditor_id BIGINT COMMENT '审核员ID',
    audit_reason TEXT COMMENT '审核意见',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (auditor_id) REFERENCES users(id),
    INDEX idx_content (content_type, content_id),
    INDEX idx_status (status),
    INDEX idx_auditor_id (auditor_id)
) COMMENT='内容审核表';


-- 修改用户表，添加VIP相关字段
ALTER TABLE users ADD COLUMN is_vip BOOLEAN DEFAULT FALSE COMMENT '是否VIP用户';
ALTER TABLE users ADD COLUMN vip_expire_date DATE COMMENT 'VIP到期日期';

-- 修改帖子表，添加审核状态
ALTER TABLE posts ADD COLUMN audit_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING' COMMENT '审核状态';

-- 修改评论表，添加审核状态
ALTER TABLE comments ADD COLUMN audit_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING' COMMENT '审核状态';

-- 为现有表添加更多索引以提升查询性能
ALTER TABLE posts ADD INDEX idx_audit_status (audit_status);
ALTER TABLE posts ADD INDEX idx_is_top_status (is_top, status);
ALTER TABLE posts ADD INDEX idx_like_count (like_count);
ALTER TABLE posts ADD INDEX idx_view_count (view_count);

ALTER TABLE comments ADD INDEX idx_audit_status (audit_status);
ALTER TABLE comments ADD INDEX idx_like_count (like_count);

ALTER TABLE users ADD INDEX idx_is_vip (is_vip);
ALTER TABLE users ADD INDEX idx_role_status (role, status);


-- 添加常用标签
INSERT INTO tags (name, description) VALUES
('新手入门', '适合新手的基础知识'),
('高级技术', '高级养殖技术分享'),
('成本控制', '降低养殖成本的方法'),
('市场分析', '市场行情和价格分析'),
('政策解读', '相关政策法规解读'),
('设备推荐', '养殖设备推荐和评测'),
('季节管理', '不同季节的管理要点'),
('繁殖技术', '林麝繁殖相关技术');