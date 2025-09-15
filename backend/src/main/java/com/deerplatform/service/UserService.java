package com.deerplatform.service;

import com.deerplatform.dto.RegisterRequest;
import com.deerplatform.dto.UserDTO;
import com.deerplatform.entity.User;
import com.deerplatform.repository.PostRepository;
import com.deerplatform.repository.UserRepository;
import com.deerplatform.repository.UserFavoriteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PostRepository postRepository;
    private final UserFavoriteRepository userFavoriteRepository;
    
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findActiveUserByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("用户不存在或已被禁用: " + username));
    }
    
    @Transactional
    public UserDTO register(RegisterRequest request) {
        // 验证用户名和邮箱是否已存在
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }
        
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("邮箱已被注册");
        }
        
        // 验证密码确认
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("两次输入的密码不一致");
        }
        
        // 创建新用户
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setNickname(request.getNickname() != null ? request.getNickname() : request.getUsername());
        user.setRole(User.Role.USER);
        user.setStatus(User.Status.ACTIVE);
        user.setEmailVerified(false);
        
        User savedUser = userRepository.save(user);
        return UserDTO.fromEntity(savedUser);
    }
    
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
    
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    @Transactional
    public void updateLastLoginTime(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            user.setLastLoginTime(LocalDateTime.now());
            userRepository.save(user);
        });
    }
    
    public UserDTO getUserInfo(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        return UserDTO.fromEntity(user);
    }
    
    @Transactional
    public UserDTO updateUserProfile(String username, UserDTO userDTO) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        if (userDTO.getNickname() != null) {
            user.setNickname(userDTO.getNickname());
        }
        if (userDTO.getBio() != null) {
            user.setBio(userDTO.getBio());
        }
        if (userDTO.getAvatarUrl() != null) {
            user.setAvatarUrl(userDTO.getAvatarUrl());
        }
        if (userDTO.getLocation() != null) {
            user.setLocation(userDTO.getLocation());
        }
        
        User savedUser = userRepository.save(user);
        return UserDTO.fromEntity(savedUser);
    }
    
    /**
     * 邮箱注册（已验证邮箱）
     */
    @Transactional
    public UserDTO registerWithEmail(RegisterRequest request) {
        // 验证用户名和邮箱是否已存在
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }
        
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("邮箱已被注册");
        }
        
        // 创建新用户
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setNickname(request.getNickname() != null ? request.getNickname() : request.getUsername());
        user.setRole(User.Role.USER);
        user.setStatus(User.Status.ACTIVE);
        user.setEmailVerified(true); // 邮箱注册时已验证
        
        User savedUser = userRepository.save(user);
        return UserDTO.fromEntity(savedUser);
    }
    
    /**
     * 重置密码
     */
    @Transactional
    public void resetPassword(String email, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("邮箱不存在"));
        
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
    
    /**
     * 修改密码
     */
    @Transactional
    public void changePassword(String username, String oldPassword, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        // 验证原密码
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("原密码错误");
        }
        
        // 更新密码
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
    
    /**
     * 获取用户统计信息
     */
    public Map<String, Object> getUserStats(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        Map<String, Object> stats = new HashMap<>();
        
        // 基本信息
        stats.put("userId", user.getId());
        stats.put("username", user.getUsername());
        stats.put("joinDate", user.getCreatedAt());
        
        // 帖子统计
        long publishedPosts = postRepository.countByAuthorAndStatus(user, com.deerplatform.entity.Post.Status.PUBLISHED);
        long draftPosts = postRepository.countByAuthorAndStatus(user, com.deerplatform.entity.Post.Status.DRAFT);
        stats.put("publishedPosts", publishedPosts);
        stats.put("draftPosts", draftPosts);
        stats.put("totalPosts", publishedPosts + draftPosts);
        
        // 收藏统计
        long collections = userFavoriteRepository.countByUserId(user.getId());
        stats.put("collections", collections);
        
        // 关注统计（暂时设为0，后续实现关注功能时更新）
        stats.put("follows", 0);
        
        return stats;
    }
}