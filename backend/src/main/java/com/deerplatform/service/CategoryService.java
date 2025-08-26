package com.deerplatform.service;

import com.deerplatform.dto.CategoryDTO;
import com.deerplatform.entity.Category;
import com.deerplatform.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryService {
    
    private final CategoryRepository categoryRepository;
    
    /**
     * 创建分类
     */
    public CategoryDTO createCategory(String name, String description, String icon) {
        // 检查分类名称是否已存在
        if (categoryRepository.existsByName(name)) {
            throw new RuntimeException("分类名称已存在");
        }
        
        Category category = new Category();
        category.setName(name);
        category.setDescription(description);
        category.setIcon(icon);
        category.setStatus(Category.Status.ACTIVE);
        category.setSortOrder(getNextSortOrder());
        
        Category savedCategory = categoryRepository.save(category);
        return CategoryDTO.fromEntity(savedCategory);
    }
    
    /**
     * 更新分类
     */
    public CategoryDTO updateCategory(Long categoryId, String name, String description, String icon) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("分类不存在"));
        
        // 如果名称发生变化，检查新名称是否已存在
        if (!category.getName().equals(name) && categoryRepository.existsByName(name)) {
            throw new RuntimeException("分类名称已存在");
        }
        
        category.setName(name);
        category.setDescription(description);
        category.setIcon(icon);
        category.setUpdatedAt(LocalDateTime.now());
        
        Category savedCategory = categoryRepository.save(category);
        return CategoryDTO.fromEntity(savedCategory);
    }
    
    /**
     * 删除分类
     */
    public void deleteCategory(Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("分类不存在"));
        
        // 软删除：设置状态为INACTIVE
        category.setStatus(Category.Status.INACTIVE);
        category.setUpdatedAt(LocalDateTime.now());
        categoryRepository.save(category);
    }
    
    /**
     * 获取分类详情
     */
    @Transactional(readOnly = true)
    public CategoryDTO getCategoryById(Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("分类不存在"));
        return CategoryDTO.fromEntity(category);
    }
    
    /**
     * 获取所有激活的分类
     */
    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllActiveCategories() {
        List<Category> categories = categoryRepository.findActiveCategories(Category.Status.ACTIVE);
        return categories.stream()
                .map(CategoryDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 分页获取分类列表
     */
    @Transactional(readOnly = true)
    public Page<CategoryDTO> getCategories(Category.Status status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "sortOrder"));
        Page<Category> categories = categoryRepository.findByStatus(status, pageable);
        return categories.map(CategoryDTO::fromEntity);
    }
    
    /**
     * 更新分类排序
     */
    public void updateCategorySortOrder(Long categoryId, Integer sortOrder) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("分类不存在"));
        
        category.setSortOrder(sortOrder);
        category.setUpdatedAt(LocalDateTime.now());
        categoryRepository.save(category);
    }
    
    /**
     * 获取下一个排序号
     */
    private Integer getNextSortOrder() {
        List<Category> categories = categoryRepository.findByStatusOrderBySortOrderAsc(Category.Status.ACTIVE);
        if (categories.isEmpty()) {
            return 1;
        }
        return categories.get(categories.size() - 1).getSortOrder() + 1;
    }
    
    /**
     * 统计分类数量
     */
    @Transactional(readOnly = true)
    public long countActiveCategories() {
        return categoryRepository.countByStatus(Category.Status.ACTIVE);
    }
}