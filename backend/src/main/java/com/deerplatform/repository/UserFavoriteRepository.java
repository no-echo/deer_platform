package com.deerplatform.repository;

import com.deerplatform.entity.UserFavorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserFavoriteRepository extends JpaRepository<UserFavorite, Long> {
    
    // 查找用户是否已收藏某个帖子
    Optional<UserFavorite> findByUserIdAndPostId(Long userId, Long postId);
    
    // 检查用户是否已收藏某个帖子
    boolean existsByUserIdAndPostId(Long userId, Long postId);
    
    // 获取用户收藏的帖子列表
    @Query(value = "SELECT uf FROM UserFavorite uf JOIN FETCH uf.post p WHERE uf.userId = :userId ORDER BY uf.createdAt DESC",
           countQuery = "SELECT COUNT(uf) FROM UserFavorite uf WHERE uf.userId = :userId")
    Page<UserFavorite> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId, Pageable pageable);
    
    // 统计用户收藏数量
    long countByUserId(Long userId);
    
    // 统计帖子被收藏数量
    long countByPostId(Long postId);
    
    // 删除用户对某个帖子的收藏
    void deleteByUserIdAndPostId(Long userId, Long postId);
}