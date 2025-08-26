package com.deerplatform.service;

import com.deerplatform.entity.EmailVerification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.servlet.http.HttpServletRequest;

@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationService {
    
    private final EmailService emailService;
    
    /**
     * 发送注册验证码
     */
    public void sendRegistrationCode(String email, HttpServletRequest request) {
        validateEmail(email);
        emailService.sendVerificationCode(email, EmailVerification.Type.REGISTRATION, request);
    }
    
    /**
     * 发送密码重置验证码
     */
    public void sendPasswordResetCode(String email, HttpServletRequest request) {
        validateEmail(email);
        emailService.sendVerificationCode(email, EmailVerification.Type.PASSWORD_RESET, request);
    }
    
    /**
     * 发送邮箱变更验证码
     */
    public void sendEmailChangeCode(String email, HttpServletRequest request) {
        validateEmail(email);
        emailService.sendVerificationCode(email, EmailVerification.Type.EMAIL_CHANGE, request);
    }
    
    /**
     * 验证注册验证码
     */
    public boolean verifyRegistrationCode(String email, String code) {
        validateEmail(email);
        validateCode(code);
        return emailService.verifyCode(email, code, EmailVerification.Type.REGISTRATION);
    }
    
    /**
     * 验证密码重置验证码
     */
    public boolean verifyPasswordResetCode(String email, String code) {
        validateEmail(email);
        validateCode(code);
        return emailService.verifyCode(email, code, EmailVerification.Type.PASSWORD_RESET);
    }
    
    /**
     * 验证邮箱变更验证码
     */
    public boolean verifyEmailChangeCode(String email, String code) {
        validateEmail(email);
        validateCode(code);
        return emailService.verifyCode(email, code, EmailVerification.Type.EMAIL_CHANGE);
    }
    
    /**
     * 验证邮箱格式
     */
    private void validateEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("邮箱不能为空");
        }
        
        String emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
        if (!email.matches(emailRegex)) {
            throw new IllegalArgumentException("邮箱格式不正确");
        }
    }
    
    /**
     * 验证验证码格式
     */
    private void validateCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            throw new IllegalArgumentException("验证码不能为空");
        }
        
        if (!code.matches("^\\d{6}$")) {
            throw new IllegalArgumentException("验证码必须是6位数字");
        }
    }
}