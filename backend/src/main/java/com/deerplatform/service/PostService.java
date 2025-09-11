package com.deerplatform.service;

import com.deerplatform.dto.PostCreateRequest;
import com.deerplatform.dto.PostDTO;
import com.deerplatform.dto.PostUpdateRequest;
import com.deerplatform.entity.Post;
import com.deerplatform.entity.User;
import com.deerplatform.entity.Category;
import com.deerplatform.entity.UserFavorite;
import com.deerplatform.entity.UserLike;
import com.deerplatform.repository.PostRepository;
import com.deerplatform.repository.CategoryRepository;
import com.deerplatform.repository.UserRepository;
import com.deerplatform.repository.UserFavoriteRepository;
import com.deerplatform.repository.UserLikeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class PostService {
    
    private final PostRepository postRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final UserFavoriteRepository userFavoriteRepository;
    private final UserLikeRepository userLikeRepository;
    
    /**
     * 创建帖子
     */
    public PostDTO createPost(PostCreateRequest request, User author) {
        // 验证分类是否存在
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("分类不存在"));
        
        Post post = new Post();
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setSummary(generateSummary(request.getContent()));
        post.setAuthorId(author.getId());  // 修改：设置authorId而不是author对象
        post.setCategoryId(request.getCategoryId());  // 修改：设置categoryId而不是category对象
        post.setStatus(Post.Status.PUBLISHED);
        post.setViewCount(0);
        post.setLikeCount(0);
        post.setCommentCount(0);
        post.setCreatedAt(LocalDateTime.now());
        post.setUpdatedAt(LocalDateTime.now());
        
        Post savedPost = postRepository.save(post);
        return PostDTO.fromEntity(savedPost);
    }
    
    /**
     * 更新帖子
     */
    public PostDTO updatePost(Long postId, PostUpdateRequest request, User currentUser) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("帖子不存在"));
        
        // 检查权限：只有作者或管理员可以编辑
        if (!post.getAuthor().getId().equals(currentUser.getId()) && 
            !currentUser.getRole().equals(User.Role.ADMIN)) {  // 修改：UserRole.ADMIN → Role.ADMIN
            throw new RuntimeException("没有权限编辑此帖子");
        }
        
        // 更新分类（如果提供）
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("分类不存在"));
            post.setCategoryId(request.getCategoryId());  // 修改：设置categoryId而不是category对象
        }
        
        // 更新内容
        if (request.getTitle() != null) {
            post.setTitle(request.getTitle());
        }
        if (request.getContent() != null) {
            post.setContent(request.getContent());
            post.setSummary(generateSummary(request.getContent()));
        }
        
        post.setUpdatedAt(LocalDateTime.now());
        
        Post savedPost = postRepository.save(post);
        return PostDTO.fromEntity(savedPost);
    }
    
    /**
     * 删除帖子
     */
    public void deletePost(Long postId, User currentUser) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("帖子不存在"));
        
        // 检查权限：只有作者或管理员可以删除
        if (!post.getAuthor().getId().equals(currentUser.getId()) && 
            !currentUser.getRole().equals(User.Role.ADMIN)) {  // 修改：UserRole.ADMIN → Role.ADMIN
            throw new RuntimeException("没有权限删除此帖子");
        }
        
        postRepository.delete(post);
    }
    
    /**
     * 获取帖子详情
     */
    @Transactional(readOnly = true)
    public PostDTO getPostById(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("帖子不存在"));
        
        // 增加浏览量
        post.setViewCount(post.getViewCount() + 1);
        postRepository.save(post);
        
        return PostDTO.fromEntity(post);
    }
    
    /**
     * 获取帖子列表
     */
    @Transactional(readOnly = true)
    public Page<PostDTO> getPosts(Long categoryId, String sortBy, int page, int size) {
        Pageable pageable = createPageable(sortBy, page, size);
        
        Page<Post> posts;
        if (categoryId != null) {
            Category category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new RuntimeException("分类不存在"));
            posts = postRepository.findByCategoryAndStatus(category, Post.Status.PUBLISHED, pageable);  // 修改这里
        } else {
            posts = postRepository.findByStatus(Post.Status.PUBLISHED, pageable);  // 修改这里
        }
        
        return posts.map(PostDTO::fromEntity);
    }
    
    /**
     * 搜索帖子
     */
    @Transactional(readOnly = true)
    public Page<PostDTO> searchPosts(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Post> posts = postRepository.searchByKeyword(keyword, Post.Status.PUBLISHED, pageable);  // 修改这里
        return posts.map(PostDTO::fromEntity);
    }
    
    /**
     * 获取用户的帖子
     */
    @Transactional(readOnly = true)
    public Page<PostDTO> getUserPosts(User user, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Post> posts = postRepository.findByAuthor(user, pageable);
        return posts.map(PostDTO::fromEntity);
    }
    
    /**
     * 根据用户名获取用户的帖子
     */
    @Transactional(readOnly = true)
    public Page<PostDTO> getUserPosts(String username, int page, int size) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        return getUserPosts(user, page, size);
    }
    
    /**
     * 获取用户收藏的帖子
     */
    @Transactional(readOnly = true)
    public Page<PostDTO> getUserCollections(String username, int page, int size) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<UserFavorite> favorites = userFavoriteRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
        
        return favorites.map(favorite -> PostDTO.fromEntity(favorite.getPost()));
    }
    
    /**
     * 获取热门帖子
     */
    @Transactional(readOnly = true)
    public Page<PostDTO> getPopularPosts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> posts = postRepository.findPopularPosts(Post.Status.PUBLISHED, pageable);  // 修改这里
        return posts.map(PostDTO::fromEntity);
    }
    
    /**
     * 生成帖子摘要
     */
    private String generateSummary(String content) {
        if (content == null || content.trim().isEmpty()) {
            return "";
        }
        
        // 移除HTML标签
        String plainText = content.replaceAll("<[^>]*>", "");
        
        // 截取前200个字符作为摘要
        if (plainText.length() <= 200) {
            return plainText;
        }
        
        return plainText.substring(0, 200) + "...";
    }
    
    /**
     * 创建分页对象
     */
    private Pageable createPageable(String sortBy, int page, int size) {
        Sort sort;
        switch (sortBy) {
            case "popular":
                sort = Sort.by(Sort.Direction.DESC, "viewCount");
                break;
            case "likes":
                sort = Sort.by(Sort.Direction.DESC, "likeCount");
                break;
            case "comments":
                sort = Sort.by(Sort.Direction.DESC, "commentCount");
                break;
            case "oldest":
                sort = Sort.by(Sort.Direction.ASC, "createdAt");
                break;
            default: // "latest"
                sort = Sort.by(Sort.Direction.DESC, "createdAt");
                break;
        }
        
        return PageRequest.of(page, size, sort);
    }
    
    /**
     * 切换帖子点赞状态
     */
    public boolean toggleLike(Long postId, Long userId) {
        // 检查帖子是否存在
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("帖子不存在"));
        
        Optional<UserLike> existingLike = userLikeRepository.findByUserIdAndTargetIdAndTargetType(
                userId, postId, UserLike.TargetType.POST);
        
        if (existingLike.isPresent()) {
            // 已点赞，取消点赞
            userLikeRepository.deleteByUserIdAndTargetIdAndTargetType(
                    userId, postId, UserLike.TargetType.POST);
            post.setLikeCount(Math.max(0, post.getLikeCount() - 1));
            postRepository.save(post);
            return false;
        } else {
            // 未点赞，添加点赞
            UserLike userLike = new UserLike();
            userLike.setUserId(userId);
            userLike.setTargetId(postId);
            userLike.setTargetType(UserLike.TargetType.POST);
            userLikeRepository.save(userLike);
            
            post.setLikeCount(post.getLikeCount() + 1);
            postRepository.save(post);
            return true;
        }
    }
    
    /**
     * 切换帖子收藏状态
     */
    public boolean toggleFavorite(Long postId, Long userId) {
        // 检查帖子是否存在
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("帖子不存在"));
        
        Optional<UserFavorite> existingFavorite = userFavoriteRepository.findByUserIdAndPostId(userId, postId);
        
        if (existingFavorite.isPresent()) {
            // 已收藏，取消收藏
            userFavoriteRepository.deleteByUserIdAndPostId(userId, postId);
            return false;
        } else {
            // 未收藏，添加收藏
            UserFavorite userFavorite = new UserFavorite();
            userFavorite.setUserId(userId);
            userFavorite.setPostId(postId);
            userFavoriteRepository.save(userFavorite);
            return true;
        }
    }
    
    /**
     * 获取帖子的点赞和收藏状态
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getPostStatus(Long postId, Long userId) {
        Map<String, Object> status = new HashMap<>();
        
        // 获取点赞数量
        long likeCount = userLikeRepository.countByTargetIdAndTargetType(postId, UserLike.TargetType.POST);
        status.put("likeCount", likeCount);
        
        // 获取收藏数量
        long favoriteCount = userFavoriteRepository.countByPostId(postId);
        status.put("favoriteCount", favoriteCount);
        
        if (userId != null) {
            // 检查当前用户是否已点赞
            boolean isLiked = userLikeRepository.existsByUserIdAndTargetIdAndTargetType(
                    userId, postId, UserLike.TargetType.POST);
            status.put("isLiked", isLiked);
            
            // 检查当前用户是否已收藏
            boolean isFavorited = userFavoriteRepository.existsByUserIdAndPostId(userId, postId);
            status.put("isFavorited", isFavorited);
        } else {
            status.put("isLiked", false);
            status.put("isFavorited", false);
        }
        
        return status;
    }
}