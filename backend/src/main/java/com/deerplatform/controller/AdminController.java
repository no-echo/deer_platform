package com.deerplatform.controller;

import com.deerplatform.dto.UserDTO;
import com.deerplatform.dto.PostDTO;
import com.deerplatform.entity.User;
import com.deerplatform.entity.Post;
import com.deerplatform.service.UserService;
import com.deerplatform.service.PostService;
import com.deerplatform.service.CategoryService;
import com.deerplatform.repository.UserRepository;
import com.deerplatform.repository.PostRepository;
import com.deerplatform.repository.CategoryRepository;
import com.deerplatform.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {
    
    private final UserService userService;
    private final PostService postService;
    private final CategoryService categoryService;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CategoryRepository categoryRepository;
    
    /**
     * 检查管理员权限
     */
    private void checkAdminPermission(User currentUser) {
        if (!currentUser.getRole().equals(User.Role.ADMIN)) {
            throw new RuntimeException("没有权限执行此操作");
        }
    }
    
    /**
     * 获取管理员仪表板统计数据
     */
    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats(
            @AuthenticationPrincipal User currentUser) {
        try {
            checkAdminPermission(currentUser);
            
            Map<String, Object> stats = new HashMap<>();
            
            // 用户统计
            long totalUsers = userRepository.count();
            long activeUsers = userRepository.countByStatus(User.Status.ACTIVE);
            long bannedUsers = userRepository.countByStatus(User.Status.BANNED);
            
            // 帖子统计
            long totalPosts = postRepository.count();
            long publishedPosts = postRepository.countByStatus(Post.Status.PUBLISHED);
            long draftPosts = postRepository.countByStatus(Post.Status.DRAFT);
            
            // 分类统计
            long totalCategories = categoryRepository.count();
            long activeCategories = categoryService.countActiveCategories();
            
            Map<String, Object> userStats = new HashMap<>();
            userStats.put("total", totalUsers);
            userStats.put("active", activeUsers);
            userStats.put("banned", bannedUsers);
            stats.put("users", userStats);
            
            Map<String, Object> postStats = new HashMap<>();
            postStats.put("total", totalPosts);
            postStats.put("published", publishedPosts);
            postStats.put("draft", draftPosts);
            stats.put("posts", postStats);
            
            Map<String, Object> categoryStats = new HashMap<>();
            categoryStats.put("total", totalCategories);
            categoryStats.put("active", activeCategories);
            stats.put("categories", categoryStats);
            
            return ResponseEntity.ok(ResponseUtil.success("获取统计数据成功", stats));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("获取统计数据失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取用户列表（管理员）
     */
    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @AuthenticationPrincipal User currentUser) {
        try {
            checkAdminPermission(currentUser);
            
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<User> users;
            
            if (keyword != null && !keyword.trim().isEmpty()) {
                // 搜索用户
                users = userRepository.findByUsernameContainingOrEmailContainingOrNicknameContaining(
                    keyword, keyword, keyword, pageable);
            } else if (status != null) {
                // 按状态筛选
                User.Status userStatus = User.Status.valueOf(status.toUpperCase());
                users = userRepository.findByStatus(userStatus, pageable);
            } else {
                // 获取所有用户
                users = userRepository.findAll(pageable);
            }
            
            Page<UserDTO> userDTOs = users.map(UserDTO::fromEntity);
            return ResponseEntity.ok(ResponseUtil.success("获取用户列表成功", userDTOs));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("获取用户列表失败: " + e.getMessage()));
        }
    }
    
    /**
     * 更新用户状态（管理员）
     */
    @PutMapping("/users/{userId}/status")
    public ResponseEntity<Map<String, Object>> updateUserStatus(
            @PathVariable Long userId,
            @RequestParam String status,
            @AuthenticationPrincipal User currentUser) {
        try {
            checkAdminPermission(currentUser);
            
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
            
            User.Status newStatus = User.Status.valueOf(status.toUpperCase());
            user.setStatus(newStatus);
            userRepository.save(user);
            
            return ResponseEntity.ok(ResponseUtil.success("用户状态更新成功", UserDTO.fromEntity(user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("更新用户状态失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取帖子列表（管理员）
     */
    @GetMapping("/posts")
    public ResponseEntity<Map<String, Object>> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @AuthenticationPrincipal User currentUser) {
        try {
            checkAdminPermission(currentUser);
            
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<Post> posts;
            
            if (keyword != null && !keyword.trim().isEmpty()) {
                // 搜索帖子
                Post.Status postStatus = status != null ? Post.Status.valueOf(status.toUpperCase()) : null;
                if (postStatus != null) {
                    posts = postRepository.searchByKeyword(keyword, postStatus, pageable);
                } else {
                    // 搜索所有状态的帖子
                    posts = postRepository.findByTitleContainingOrContentContaining(keyword, keyword, pageable);
                }
            } else if (status != null) {
                // 按状态筛选
                Post.Status postStatus = Post.Status.valueOf(status.toUpperCase());
                posts = postRepository.findByStatus(postStatus, pageable);
            } else {
                // 获取所有帖子
                posts = postRepository.findAll(pageable);
            }
            
            Page<PostDTO> postDTOs = posts.map(PostDTO::fromEntity);
            return ResponseEntity.ok(ResponseUtil.success("获取帖子列表成功", postDTOs));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("获取帖子列表失败: " + e.getMessage()));
        }
    }
    
    /**
     * 更新帖子状态（管理员）
     */
    @PutMapping("/posts/{postId}/status")
    public ResponseEntity<Map<String, Object>> updatePostStatus(
            @PathVariable Long postId,
            @RequestParam String status,
            @AuthenticationPrincipal User currentUser) {
        try {
            checkAdminPermission(currentUser);
            
            Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("帖子不存在"));
            
            Post.Status newStatus = Post.Status.valueOf(status.toUpperCase());
            post.setStatus(newStatus);
            post.setUpdatedAt(LocalDateTime.now());
            postRepository.save(post);
            
            return ResponseEntity.ok(ResponseUtil.success("帖子状态更新成功", PostDTO.fromEntity(post)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("更新帖子状态失败: " + e.getMessage()));
        }
    }
    
    /**
     * 删除帖子（管理员）
     */
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Map<String, Object>> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal User currentUser) {
        try {
            checkAdminPermission(currentUser);
            
            Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("帖子不存在"));
            
            postRepository.delete(post);
            
            return ResponseEntity.ok(ResponseUtil.success("帖子删除成功", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("删除帖子失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取最新用户活动
     */
    @GetMapping("/activities/recent")
    public ResponseEntity<Map<String, Object>> getRecentActivities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal User currentUser) {
        try {
            checkAdminPermission(currentUser);
            
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            
            // 获取最新注册的用户
            Page<User> recentUsers = userRepository.findAll(pageable);
            
            // 获取最新发布的帖子
            Page<Post> recentPosts = postRepository.findAll(pageable);
            
            Map<String, Object> activities = new HashMap<>();
            activities.put("recentUsers", recentUsers.map(UserDTO::fromEntity));
            activities.put("recentPosts", recentPosts.map(PostDTO::fromEntity));
            
            return ResponseEntity.ok(ResponseUtil.success("获取最新活动成功", activities));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("获取最新活动失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取系统概览信息
     */
    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getSystemOverview(
            @AuthenticationPrincipal User currentUser) {
        try {
            checkAdminPermission(currentUser);
            
            Map<String, Object> overview = new HashMap<>();
            
            // 今日新增用户
            LocalDateTime todayStart = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
            long todayNewUsers = userRepository.countByCreatedAtAfter(todayStart);
            
            // 今日新增帖子
            long todayNewPosts = postRepository.countByCreatedAtAfter(todayStart);
            
            // 活跃用户（最近7天有登录）
            LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
            long activeUsersWeek = userRepository.countByLastLoginTimeAfter(weekAgo);
            
            overview.put("todayNewUsers", todayNewUsers);
            overview.put("todayNewPosts", todayNewPosts);
            overview.put("activeUsersWeek", activeUsersWeek);
            
            return ResponseEntity.ok(ResponseUtil.success("获取系统概览成功", overview));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("获取系统概览失败: " + e.getMessage()));
        }
    }
}