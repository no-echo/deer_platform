package com.deerplatform.dto;

import com.deerplatform.entity.User;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserDTO {
    
    private Long id;
    private String username;
    private String email;
    private String nickname;
    private String avatarUrl;
    private String bio;
    private String location;
    private User.Role role;
    private User.Status status;
    private Boolean emailVerified;
    private LocalDateTime lastLoginTime;
    private LocalDateTime createdAt;
    
    public static UserDTO fromEntity(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setNickname(user.getNickname());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setBio(user.getBio());
        dto.setLocation(user.getLocation());
        dto.setRole(user.getRole());
        dto.setStatus(user.getStatus());
        dto.setEmailVerified(user.getEmailVerified());
        dto.setLastLoginTime(user.getLastLoginTime());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
}