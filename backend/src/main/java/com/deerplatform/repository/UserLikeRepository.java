package com.deerplatform.repository;

import com.deerplatform.entity.UserLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserLikeRepository extends JpaRepository<UserLike, Long> {
    
    // 查找用户是否已点赞某个目标
    Optional<UserLike> findByUserIdAndTargetIdAndTargetType(Long userId, Long targetId, UserLike.TargetType targetType);
    
    // 检查用户是否已点赞某个目标
    boolean existsByUserIdAndTargetIdAndTargetType(Long userId, Long targetId, UserLike.TargetType targetType);
    
    // 统计某个目标的点赞数量
    long countByTargetIdAndTargetType(Long targetId, UserLike.TargetType targetType);
    
    // 统计用户点赞数量
    long countByUserId(Long userId);
    
    // 删除用户对某个目标的点赞
    void deleteByUserIdAndTargetIdAndTargetType(Long userId, Long targetId, UserLike.TargetType targetType);
}