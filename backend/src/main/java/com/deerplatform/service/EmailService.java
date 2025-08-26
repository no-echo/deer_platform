package com.deerplatform.service;

import com.deerplatform.entity.EmailVerification;
import com.deerplatform.repository.EmailVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.servlet.http.HttpServletRequest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {
    
    private final JavaMailSender mailSender;
    private final EmailVerificationRepository verificationRepository;
    private final SecureRandom secureRandom = new SecureRandom();
    
    @Value("${spring.mail.username}")
    private String fromEmail;
    
    /**
     * 发送验证码邮件
     */
    @Transactional
    public void sendVerificationCode(String email, EmailVerification.Type type, HttpServletRequest request) {
        // 检查发送频率限制（每分钟最多1次）
        checkSendFrequency(email, type);
        
        // 生成6位数字验证码
        String code = generateVerificationCode();
        
        // 获取客户端IP地址
        String ipAddress = getClientIpAddress(request);
        
        // 删除该邮箱之前未使用的验证码
        verificationRepository.deleteByEmailAndType(email, type);
        
        // 创建新的验证码记录
        EmailVerification verification = new EmailVerification();
        verification.setEmail(email);
        verification.setCode(code);
        verification.setType(type);
        verification.setIpAddress(ipAddress);
        verification.setExpiresAt(LocalDateTime.now().plusMinutes(5)); // 5分钟有效期
        
        verificationRepository.save(verification);
        
        // 发送邮件
        sendEmail(email, code, type);
        
        log.info("验证码已发送到邮箱: {}, 类型: {}, IP: {}", email, type, ipAddress);
    }
    
    /**
     * 验证验证码
     */
    @Transactional
    public boolean verifyCode(String email, String code, EmailVerification.Type type) {
        // 先更新过期的验证码状态
        verificationRepository.updateExpiredVerifications(LocalDateTime.now());
        
        Optional<EmailVerification> verificationOpt = verificationRepository
            .findValidVerificationCode(email, code, type, LocalDateTime.now());
        
        if (verificationOpt.isPresent()) {
            EmailVerification verification = verificationOpt.get();
            verification.markAsUsed();
            verificationRepository.save(verification);
            
            log.info("验证码验证成功: {}, 类型: {}", email, type);
            return true;
        }
        
        log.warn("验证码验证失败: {}, 类型: {}, 代码: {}", email, type, code);
        return false;
    }
    
    /**
     * 检查发送频率限制
     */
    private void checkSendFrequency(String email, EmailVerification.Type type) {
        LocalDateTime oneMinuteAgo = LocalDateTime.now().minusMinutes(1);
        long recentCount = verificationRepository.countByEmailAndTypeAndCreatedAtAfter(
            email, type, oneMinuteAgo);
        
        if (recentCount > 0) {
            throw new RuntimeException("发送过于频繁，请稍后再试");
        }
    }
    
    /**
     * 生成6位数字验证码
     */
    private String generateVerificationCode() {
        int code = 100000 + secureRandom.nextInt(900000);
        return String.valueOf(code);
    }
    
    /**
     * 发送邮件
     */
    private void sendEmail(String email, String code, EmailVerification.Type type) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(email);
            
            String subject;
            String content;
            
            switch (type) {
                case REGISTRATION:
                    subject = "【林麝养殖平台】邮箱验证码";
                    content = String.format(
                        "您好！\n\n" +
                        "您正在注册林麝养殖交流分享平台账户，验证码为：%s\n\n" +
                        "验证码有效期为5分钟，请及时使用。\n\n" +
                        "如果这不是您的操作，请忽略此邮件。\n\n" +
                        "林麝养殖交流分享平台\n" +
                        "%s", 
                        code, LocalDateTime.now().toString().substring(0, 19));
                    break;
                case PASSWORD_RESET:
                    subject = "【林麝养殖平台】密码重置验证码";
                    content = String.format(
                        "您好！\n\n" +
                        "您正在重置林麝养殖交流分享平台账户密码，验证码为：%s\n\n" +
                        "验证码有效期为5分钟，请及时使用。\n\n" +
                        "如果这不是您的操作，请立即联系我们。\n\n" +
                        "林麝养殖交流分享平台\n" +
                        "%s", 
                        code, LocalDateTime.now().toString().substring(0, 19));
                    break;
                case EMAIL_CHANGE:
                    subject = "【林麝养殖平台】邮箱变更验证码";
                    content = String.format(
                        "您好！\n\n" +
                        "您正在变更林麝养殖交流分享平台账户邮箱，验证码为：%s\n\n" +
                        "验证码有效期为5分钟，请及时使用。\n\n" +
                        "如果这不是您的操作，请立即联系我们。\n\n" +
                        "林麝养殖交流分享平台\n" +
                        "%s", 
                        code, LocalDateTime.now().toString().substring(0, 19));
                    break;
                default:
                    throw new IllegalArgumentException("不支持的验证码类型: " + type);
            }
            
            message.setSubject(subject);
            message.setText(content);
            
            mailSender.send(message);
            log.info("邮件发送成功: {} -> {}", fromEmail, email);
            
        } catch (Exception e) {
            log.error("邮件发送失败: {} -> {}, 错误: {}", fromEmail, email, e.getMessage());
            throw new RuntimeException("邮件发送失败，请稍后重试");
        }
    }
    
    /**
     * 获取客户端真实IP地址
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
    
    /**
     * 清理过期的验证码（定时任务可调用）
     */
    @Transactional
    public void cleanupExpiredVerifications() {
        verificationRepository.updateExpiredVerifications(LocalDateTime.now());
        log.info("已清理过期的验证码");
    }
}