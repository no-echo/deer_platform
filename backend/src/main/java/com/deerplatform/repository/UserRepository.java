package com.deerplatform.repository;

import com.deerplatform.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
    
    @Query("SELECT u FROM User u WHERE u.username = :username AND u.status = 'ACTIVE'")
    Optional<User> findActiveUserByUsername(@Param("username") String username);
    
    @Query("SELECT u FROM User u WHERE u.email = :email AND u.status = 'ACTIVE'")
    Optional<User> findActiveUserByEmail(@Param("email") String email);
    
    // 按状态统计用户数量
    long countByStatus(User.Status status);
    
    // 按状态查找用户
    Page<User> findByStatus(User.Status status, Pageable pageable);
    
    // 搜索用户
    Page<User> findByUsernameContainingOrEmailContainingOrNicknameContaining(
        String username, String email, String nickname, Pageable pageable);
    
    // 统计指定时间后创建的用户数量
    long countByCreatedAtAfter(LocalDateTime dateTime);
    
    // 统计指定时间后登录的用户数量
    long countByLastLoginTimeAfter(LocalDateTime dateTime);
}