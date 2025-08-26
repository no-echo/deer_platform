package com.deerplatform.controller;

import com.deerplatform.dto.LoginRequest;
import com.deerplatform.dto.RegisterRequest;
import com.deerplatform.dto.UserDTO;
import com.deerplatform.entity.User;
import com.deerplatform.service.UserService;
import com.deerplatform.service.VerificationService;
import com.deerplatform.util.JwtUtil;
import com.deerplatform.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {
    
    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final VerificationService verificationService;
    
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            // 认证用户
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()
                    )
            );
            
            // 获取用户信息
            User user = (User) authentication.getPrincipal();
            
            // 生成JWT token
            String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
            
            // 更新最后登录时间
            userService.updateLastLoginTime(user.getUsername());
            
            // 返回用户信息和token
            Map<String, Object> data = new HashMap<>();
            data.put("token", token);
            data.put("user", UserDTO.fromEntity(user));
            
            return ResponseEntity.ok(ResponseUtil.success("登录成功", data));
            
        } catch (BadCredentialsException e) {
            return ResponseEntity.badRequest().body(ResponseUtil.badRequest("用户名或密码错误"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("登录失败: " + e.getMessage()));
        }
    }
    
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            UserDTO user = userService.register(registerRequest);
            return ResponseEntity.ok(ResponseUtil.success("注册成功", user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.badRequest(e.getMessage()));
        }
    }
    
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout() {
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(ResponseUtil.success("退出登录成功"));
    }
    
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(ResponseUtil.unauthorized("未登录"));
            }
            
            String username = authentication.getName();
            UserDTO user = userService.getUserInfo(username);
            
            return ResponseEntity.ok(ResponseUtil.success(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("获取用户信息失败: " + e.getMessage()));
        }
    }
    
    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @RequestBody UserDTO userDTO,
            Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(ResponseUtil.unauthorized("未登录"));
            }
            
            String username = authentication.getName();
            UserDTO updatedUser = userService.updateUserProfile(username, userDTO);
            
            return ResponseEntity.ok(ResponseUtil.success("更新成功", updatedUser));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("更新失败: " + e.getMessage()));
        }
    }
    
    /**
     * 发送注册验证码
     */
    @PostMapping("/send-verification-code")
    public ResponseEntity<Map<String, Object>> sendVerificationCode(
            @RequestParam String email,
            HttpServletRequest request) {
        try {
            verificationService.sendRegistrationCode(email, request);
            return ResponseEntity.ok(ResponseUtil.success("验证码已发送到您的邮箱，请查收"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ResponseUtil.badRequest(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("发送验证码失败: " + e.getMessage()));
        }
    }
    
    /**
     * 邮箱注册（需要验证码）
     */
    @PostMapping("/register-with-email")
    public ResponseEntity<Map<String, Object>> registerWithEmail(
            @RequestParam String email,
            @RequestParam String password,
            @RequestParam String confirmPassword,
            @RequestParam String verificationCode,
            @RequestParam(required = false) String nickname) {
        try {
            // 验证密码确认
            if (!password.equals(confirmPassword)) {
                return ResponseEntity.badRequest().body(ResponseUtil.badRequest("两次输入的密码不一致"));
            }
            
            // 验证验证码
            if (!verificationService.verifyRegistrationCode(email, verificationCode)) {
                return ResponseEntity.badRequest().body(ResponseUtil.badRequest("验证码错误或已过期"));
            }
            
            // 创建注册请求对象
            RegisterRequest registerRequest = new RegisterRequest();
            registerRequest.setUsername(email); // 使用邮箱作为用户名
            registerRequest.setEmail(email);
            registerRequest.setPassword(password);
            registerRequest.setNickname(nickname != null ? nickname : email.split("@")[0]);
            
            // 注册用户
            UserDTO user = userService.registerWithEmail(registerRequest);
            return ResponseEntity.ok(ResponseUtil.success("注册成功", user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ResponseUtil.badRequest(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("注册失败: " + e.getMessage()));
        }
    }
    
    /**
     * 发送密码重置验证码
     */
    @PostMapping("/send-reset-code")
    public ResponseEntity<Map<String, Object>> sendPasswordResetCode(
            @RequestParam String email,
            HttpServletRequest request) {
        try {
            verificationService.sendPasswordResetCode(email, request);
            return ResponseEntity.ok(ResponseUtil.success("密码重置验证码已发送到您的邮箱"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ResponseUtil.badRequest(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("发送验证码失败: " + e.getMessage()));
        }
    }
    
    /**
     * 重置密码（需要验证码）
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(
            @RequestParam String email,
            @RequestParam String newPassword,
            @RequestParam String confirmPassword,
            @RequestParam String verificationCode) {
        try {
            // 验证密码确认
            if (!newPassword.equals(confirmPassword)) {
                return ResponseEntity.badRequest().body(ResponseUtil.badRequest("两次输入的密码不一致"));
            }
            
            // 验证验证码
            if (!verificationService.verifyPasswordResetCode(email, verificationCode)) {
                return ResponseEntity.badRequest().body(ResponseUtil.badRequest("验证码错误或已过期"));
            }
            
            // 重置密码
            userService.resetPassword(email, newPassword);
            return ResponseEntity.ok(ResponseUtil.success("密码重置成功"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ResponseUtil.badRequest(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("密码重置失败: " + e.getMessage()));
        }
    }
}