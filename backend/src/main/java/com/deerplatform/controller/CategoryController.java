package com.deerplatform.controller;

import com.deerplatform.dto.CategoryDTO;
import com.deerplatform.entity.Category;
import com.deerplatform.entity.User;
import com.deerplatform.service.CategoryService;
import com.deerplatform.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CategoryController {
    
    private final CategoryService categoryService;
    
    /**
     * 创建分类（仅管理员）
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createCategory(
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String icon,
            @AuthenticationPrincipal User currentUser) {
        try {
            // 检查管理员权限
            if (!currentUser.getRole().equals(User.Role.ADMIN)) {
                return ResponseEntity.status(403).body(ResponseUtil.error("没有权限执行此操作"));
            }
            
            CategoryDTO category = categoryService.createCategory(name, description, icon);
            return ResponseEntity.ok(ResponseUtil.success("分类创建成功", category));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("创建分类失败: " + e.getMessage()));
        }
    }
    
    /**
     * 更新分类（仅管理员）
     */
    @PutMapping("/{categoryId}")
    public ResponseEntity<Map<String, Object>> updateCategory(
            @PathVariable Long categoryId,
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String icon,
            @AuthenticationPrincipal User currentUser) {
        try {
            // 检查管理员权限
            if (!currentUser.getRole().equals(User.Role.ADMIN)) {
                return ResponseEntity.status(403).body(ResponseUtil.error("没有权限执行此操作"));
            }
            
            CategoryDTO category = categoryService.updateCategory(categoryId, name, description, icon);
            return ResponseEntity.ok(ResponseUtil.success("分类更新成功", category));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("更新分类失败: " + e.getMessage()));
        }
    }
    
    /**
     * 删除分类（仅管理员）
     */
    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Map<String, Object>> deleteCategory(
            @PathVariable Long categoryId,
            @AuthenticationPrincipal User currentUser) {
        try {
            // 检查管理员权限
            if (!currentUser.getRole().equals(User.Role.ADMIN)) {
                return ResponseEntity.status(403).body(ResponseUtil.error("没有权限执行此操作"));
            }
            
            categoryService.deleteCategory(categoryId);
            return ResponseEntity.ok(ResponseUtil.success("分类删除成功", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("删除分类失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取分类详情
     */
    @GetMapping("/{categoryId}")
    public ResponseEntity<Map<String, Object>> getCategoryById(@PathVariable Long categoryId) {
        try {
            CategoryDTO category = categoryService.getCategoryById(categoryId);
            return ResponseEntity.ok(ResponseUtil.success("获取分类详情成功", category));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("获取分类详情失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取所有激活的分类
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllActiveCategories() {
        try {
            List<CategoryDTO> categories = categoryService.getAllActiveCategories();
            return ResponseEntity.ok(ResponseUtil.success("获取分类列表成功", categories));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("获取分类列表失败: " + e.getMessage()));
        }
    }
    
    /**
     * 分页获取分类列表（管理员）
     */
    @GetMapping("/admin")
    public ResponseEntity<Map<String, Object>> getCategoriesForAdmin(
            @RequestParam(defaultValue = "ACTIVE") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal User currentUser) {
        try {
            // 检查管理员权限
            if (!currentUser.getRole().equals(User.Role.ADMIN)) {
                return ResponseEntity.status(403).body(ResponseUtil.error("没有权限执行此操作"));
            }
            
            Category.Status categoryStatus = Category.Status.valueOf(status.toUpperCase());
            Page<CategoryDTO> categories = categoryService.getCategories(categoryStatus, page, size);
            return ResponseEntity.ok(ResponseUtil.success("获取分类列表成功", categories));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("获取分类列表失败: " + e.getMessage()));
        }
    }
    
    /**
     * 更新分类排序（仅管理员）
     */
    @PutMapping("/{categoryId}/sort")
    public ResponseEntity<Map<String, Object>> updateCategorySortOrder(
            @PathVariable Long categoryId,
            @RequestParam Integer sortOrder,
            @AuthenticationPrincipal User currentUser) {
        try {
            // 检查管理员权限
            if (!currentUser.getRole().equals(User.Role.ADMIN)) {
                return ResponseEntity.status(403).body(ResponseUtil.error("没有权限执行此操作"));
            }
            
            categoryService.updateCategorySortOrder(categoryId, sortOrder);
            return ResponseEntity.ok(ResponseUtil.success("分类排序更新成功", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("更新分类排序失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取分类统计信息
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getCategoryStats() {
        try {
            long activeCount = categoryService.countActiveCategories();
            Map<String, Object> stats = new HashMap<>();
            stats.put("activeCount", activeCount);
            return ResponseEntity.ok(ResponseUtil.success("获取分类统计成功", stats));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("获取分类统计失败: " + e.getMessage()));
        }
    }
}