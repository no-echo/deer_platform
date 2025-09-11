package com.deerplatform.controller;

import com.deerplatform.dto.ChangePasswordRequest;
import com.deerplatform.dto.PostDTO;
import com.deerplatform.dto.UserDTO;
import com.deerplatform.entity.User;
import com.deerplatform.service.PostService;
import com.deerplatform.service.UserService;
import com.deerplatform.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {
    
    private final UserService userService;
    private final PostService postService;
    
    /**
     * 获取当前用户资料
     */
    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getUserProfile(Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(ResponseUtil.unauthorized("未登录"));
            }
            
            String username = authentication.getName();
            UserDTO user = userService.getUserInfo(username);
            
            return ResponseEntity.ok(ResponseUtil.success("获取用户资料成功", user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("获取用户资料失败: " + e.getMessage()));
        }
    }
    
    /**
     * 更新用户资料
     */
    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateUserProfile(
            @RequestBody UserDTO userDTO,
            Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(ResponseUtil.unauthorized("未登录"));
            }
            
            String username = authentication.getName();
            UserDTO updatedUser = userService.updateUserProfile(username, userDTO);
            
            return ResponseEntity.ok(ResponseUtil.success("更新资料成功", updatedUser));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("更新资料失败: " + e.getMessage()));
        }
    }
    
    /**
     * 修改密码
     */
    @PutMapping("/password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(ResponseUtil.unauthorized("未登录"));
            }
            
            String username = authentication.getName();
            userService.changePassword(username, request.getOldPassword(), request.getNewPassword());
            
            return ResponseEntity.ok(ResponseUtil.success("密码修改成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("密码修改失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取用户发布的帖子
     */
    @GetMapping("/posts")
    public ResponseEntity<Map<String, Object>> getUserPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(ResponseUtil.unauthorized("未登录"));
            }
            
            String username = authentication.getName();
            Page<PostDTO> posts = postService.getUserPosts(username, page, size);
            
            return ResponseEntity.ok(ResponseUtil.success("获取用户帖子成功", posts));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("获取用户帖子失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取用户收藏的帖子
     */
    @GetMapping("/collections")
    public ResponseEntity<Map<String, Object>> getUserCollections(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(ResponseUtil.unauthorized("未登录"));
            }
            
            String username = authentication.getName();
            Page<PostDTO> collections = postService.getUserCollections(username, page, size);
            
            return ResponseEntity.ok(ResponseUtil.success("获取用户收藏成功", collections));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("获取用户收藏失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取用户统计信息
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getUserStats(Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(ResponseUtil.unauthorized("未登录"));
            }
            
            String username = authentication.getName();
            Map<String, Object> stats = userService.getUserStats(username);
            
            return ResponseEntity.ok(ResponseUtil.success("获取用户统计成功", stats));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("获取用户统计失败: " + e.getMessage()));
        }
    }
}