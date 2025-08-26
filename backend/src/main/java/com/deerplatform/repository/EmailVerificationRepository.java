package com.deerplatform.repository;

import com.deerplatform.entity.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying; // 添加这个导入
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {
    
    /**
     * 根据邮箱和类型查找最新的验证码
     */
    Optional<EmailVerification> findTopByEmailAndTypeOrderByCreatedAtDesc(
        String email, EmailVerification.Type type);
    
    /**
     * 根据邮箱、验证码和类型查找有效的验证码
     */
    @Query("SELECT ev FROM EmailVerification ev WHERE ev.email = :email " +
           "AND ev.code = :code AND ev.type = :type AND ev.status = 'PENDING' " +
           "AND ev.expiresAt > :now")
    Optional<EmailVerification> findValidVerificationCode(
        @Param("email") String email, 
        @Param("code") String code, 
        @Param("type") EmailVerification.Type type,
        @Param("now") LocalDateTime now);
    
    /**
     * 查找指定邮箱在指定时间后创建的验证码数量（用于频率限制）
     */
    long countByEmailAndTypeAndCreatedAtAfter(
        String email, EmailVerification.Type type, LocalDateTime after);
    
    /**
     * 查找已过期的验证码
     */
    List<EmailVerification> findByExpiresAtBeforeAndStatus(
        LocalDateTime dateTime, EmailVerification.Status status);
    
    /**
     * 删除指定邮箱的旧验证码
     */
    void deleteByEmailAndType(String email, EmailVerification.Type type);
    
    /**
     * 批量更新过期的验证码状态
     */
    @Modifying  // 添加这个注解
    @Query("UPDATE EmailVerification ev SET ev.status = 'EXPIRED' " +
           "WHERE ev.expiresAt < :now AND ev.status = 'PENDING'")
    void updateExpiredVerifications(@Param("now") LocalDateTime now);
}