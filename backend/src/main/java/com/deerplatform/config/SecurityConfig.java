package com.deerplatform.config;

import com.deerplatform.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {
    
    private final UserService userService;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CorsConfig corsConfig;
    private final PasswordEncoder passwordEncoder; // 注入而不是创建
    
    // 移除这个Bean定义 - 现在由PasswordConfig提供
    // @Bean
    // public PasswordEncoder passwordEncoder() {
    //     return new BCryptPasswordEncoder();
    // }
    
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userService);
        authProvider.setPasswordEncoder(passwordEncoder); // 使用注入的实例
        return authProvider;
    }
    
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            // 禁用CSRF - 使用Lambda DSL
            .csrf(csrf -> csrf.disable())
            
            // 配置CORS - 使用Lambda DSL
            .cors(cors -> cors.configurationSource(corsConfig.corsConfigurationSource()))
            
            // 配置异常处理 - 使用Lambda DSL
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(jwtAuthenticationEntryPoint)
            )
            
            // 设置会话管理为无状态 - 使用Lambda DSL
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            
            // 配置授权规则 - 使用Lambda DSL和antMatchers (Spring Security 5.7.x)
            .authorizeHttpRequests(authz -> authz
                // 公开接口
                .antMatchers("/api/auth/login", "/api/auth/register").permitAll()
                .antMatchers("/api/categories", "/api/categories/**").permitAll()
                .antMatchers("/api/posts", "/api/posts/**").permitAll()
                .antMatchers("/uploads/**").permitAll()
                .antMatchers("/error").permitAll()
                
                // 静态资源 - 添加这些配置
                .antMatchers("/*.html").permitAll()
                .antMatchers("/css/**", "/js/**", "/images/**").permitAll()
                .antMatchers("/favicon.ico").permitAll()
                
                // Swagger文档
                .antMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                
                // 需要认证的接口
                .antMatchers("/api/auth/me", "/api/auth/profile").authenticated()
                .antMatchers("/api/posts/create", "/api/posts/*/edit").authenticated()
                .antMatchers("/api/comments/**").authenticated()
                .antMatchers("/api/auth/send-verification-code", "/api/auth/register-with-email").permitAll()
                .antMatchers("/api/auth/send-reset-code", "/api/auth/reset-password").permitAll()
                
                // 管理员接口
                .antMatchers("/api/admin/**").hasRole("ADMIN")
                
                // 其他所有请求都需要认证
                .anyRequest().authenticated()
            )
            
            // 设置认证提供者
            .authenticationProvider(authenticationProvider())
            
            // 添加JWT过滤器
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            
            .build();
    }
}