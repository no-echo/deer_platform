package com.deerplatform.repository;

import com.deerplatform.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    
    // 根据状态查找分类
    List<Category> findByStatusOrderBySortOrderAsc(Category.Status status);
    
    // 根据名称查找分类
    Optional<Category> findByName(String name);
    
    // 检查分类名称是否存在
    boolean existsByName(String name);
    
    // 根据状态和排序查找分类
    @Query("SELECT c FROM Category c WHERE c.status = :status ORDER BY c.sortOrder ASC, c.createdAt ASC")
    List<Category> findActiveCategories(@Param("status") Category.Status status);
    
    // 分页查询分类
    Page<Category> findByStatus(Category.Status status, Pageable pageable);
    
    // 统计激活状态的分类数量
    long countByStatus(Category.Status status);
}