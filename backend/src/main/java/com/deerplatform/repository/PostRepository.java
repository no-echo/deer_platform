package com.deerplatform.repository;

import com.deerplatform.entity.Category;
import com.deerplatform.entity.Post;
import com.deerplatform.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    
    // 根据状态查找帖子
    Page<Post> findByStatus(Post.Status status, Pageable pageable);
    
    // 根据分类查找帖子
    Page<Post> findByCategory(Category category, Pageable pageable);
    
    // 根据分类和状态查找帖子
    Page<Post> findByCategoryAndStatus(Category category, Post.Status status, Pageable pageable);
    
    // 根据作者查找帖子
    Page<Post> findByAuthor(User author, Pageable pageable);
    
    // 根据作者和状态查找帖子
    Page<Post> findByAuthorAndStatus(User author, Post.Status status, Pageable pageable);
    
    // 搜索帖子标题和内容
    @Query("SELECT p FROM Post p WHERE (p.title LIKE %:keyword% OR p.content LIKE %:keyword%) AND p.status = :status")
    Page<Post> searchByKeyword(@Param("keyword") String keyword, @Param("status") Post.Status status, Pageable pageable);
    
    // 获取热门帖子（根据浏览量排序）
    @Query("SELECT p FROM Post p WHERE p.status = :status ORDER BY p.viewCount DESC")
    Page<Post> findPopularPosts(@Param("status") Post.Status status, Pageable pageable);
    
    // 获取最新帖子
    Page<Post> findByStatusOrderByCreatedAtDesc(Post.Status status, Pageable pageable);
    
    // 统计用户发布的帖子数量
    long countByAuthorAndStatus(User author, Post.Status status);
    
    // 统计分类下的帖子数量
    long countByCategoryAndStatus(Category category, Post.Status status);
    
    // 按状态统计帖子数量
    long countByStatus(Post.Status status);
    
    // 搜索帖子（标题或内容包含关键词）
    Page<Post> findByTitleContainingOrContentContaining(String title, String content, Pageable pageable);
    
    // 统计指定时间后创建的帖子数量
    long countByCreatedAtAfter(LocalDateTime dateTime);
}