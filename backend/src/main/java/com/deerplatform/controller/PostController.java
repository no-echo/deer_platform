package com.deerplatform.controller;

import com.deerplatform.dto.PostCreateRequest;
import com.deerplatform.dto.PostDTO;
import com.deerplatform.dto.PostUpdateRequest;
import com.deerplatform.entity.User;
import com.deerplatform.service.PostService;
import com.deerplatform.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PostController {
    
    private final PostService postService;
    
    /**
     * 创建帖子
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createPost(
            @Valid @RequestBody PostCreateRequest request,
            @AuthenticationPrincipal User currentUser) {
        try {
            PostDTO post = postService.createPost(request, currentUser);
            return ResponseEntity.ok(ResponseUtil.success("帖子创建成功", post));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("创建帖子失败: " + e.getMessage()));
        }
    }
    
    /**
     * 更新帖子
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updatePost(
            @PathVariable Long id,
            @Valid @RequestBody PostUpdateRequest request,
            @AuthenticationPrincipal User currentUser) {
        try {
            PostDTO post = postService.updatePost(id, request, currentUser);
            return ResponseEntity.ok(ResponseUtil.success("帖子更新成功", post));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("更新帖子失败: " + e.getMessage()));
        }
    }
    
    /**
     * 删除帖子
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deletePost(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        try {
            postService.deletePost(id, currentUser);
            return ResponseEntity.ok(ResponseUtil.success("帖子删除成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("删除帖子失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取帖子详情
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getPost(@PathVariable Long id) {
        try {
            PostDTO post = postService.getPostById(id);
            return ResponseEntity.ok(ResponseUtil.success("获取帖子成功", post));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("获取帖子失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取帖子列表
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getPosts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "latest") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Page<PostDTO> posts = postService.getPosts(categoryId, sortBy, page, size);
            return ResponseEntity.ok(ResponseUtil.success("获取帖子列表成功", posts));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("获取帖子列表失败: " + e.getMessage()));
        }
    }
    
    /**
     * 搜索帖子
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchPosts(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Page<PostDTO> posts = postService.searchPosts(keyword, page, size);
            return ResponseEntity.ok(ResponseUtil.success("搜索帖子成功", posts));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("搜索帖子失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取热门帖子
     */
    @GetMapping("/popular")
    public ResponseEntity<Map<String, Object>> getPopularPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Page<PostDTO> posts = postService.getPopularPosts(page, size);
            return ResponseEntity.ok(ResponseUtil.success("获取热门帖子成功", posts));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("获取热门帖子失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取用户的帖子
     */
    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> getMyPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal User currentUser) {
        try {
            Page<PostDTO> posts = postService.getUserPosts(currentUser, page, size);
            return ResponseEntity.ok(ResponseUtil.success("获取我的帖子成功", posts));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("获取我的帖子失败: " + e.getMessage()));
        }
    }
    
    /**
     * 点赞/取消点赞帖子
     */
    @PostMapping("/{id}/like")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        try {
            boolean isLiked = postService.toggleLike(id, currentUser.getId());
            String message = isLiked ? "点赞成功" : "取消点赞成功";
            return ResponseEntity.ok(ResponseUtil.success(message, Map.of("isLiked", isLiked)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("操作失败: " + e.getMessage()));
        }
    }
    
    /**
     * 收藏/取消收藏帖子
     */
    @PostMapping("/{id}/favorite")
    public ResponseEntity<Map<String, Object>> toggleFavorite(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        try {
            boolean isFavorited = postService.toggleFavorite(id, currentUser.getId());
            String message = isFavorited ? "收藏成功" : "取消收藏成功";
            return ResponseEntity.ok(ResponseUtil.success(message, Map.of("isFavorited", isFavorited)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("操作失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取帖子的点赞和收藏状态
     */
    @GetMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> getPostStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        try {
            Map<String, Object> status = postService.getPostStatus(id, currentUser != null ? currentUser.getId() : null);
            return ResponseEntity.ok(ResponseUtil.success("获取状态成功", status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("获取状态失败: " + e.getMessage()));
        }
    }
}