package com.deerplatform.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "email_verifications")
public class EmailVerification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 100)
    private String email;
    
    @Column(nullable = false, length = 6)
    private String code;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;
    
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;
    
    @Column(name = "ip_address", length = 45)
    private String ipAddress;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (expiresAt == null) {
            // 默认5分钟有效期
            expiresAt = LocalDateTime.now().plusMinutes(5);
        }
    }
    
    /**
     * 检查验证码是否已过期
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
    
    /**
     * 检查验证码是否有效（未过期且状态为PENDING）
     */
    public boolean isValid() {
        return status == Status.PENDING && !isExpired();
    }
    
    /**
     * 标记验证码为已使用
     */
    public void markAsUsed() {
        this.status = Status.USED;
        this.verifiedAt = LocalDateTime.now();
    }
    
    public enum Type {
        REGISTRATION,    // 注册验证
        PASSWORD_RESET,  // 密码重置
        EMAIL_CHANGE     // 邮箱变更
    }
    
    public enum Status {
        PENDING,  // 待验证
        USED,     // 已使用
        EXPIRED   // 已过期
    }
}