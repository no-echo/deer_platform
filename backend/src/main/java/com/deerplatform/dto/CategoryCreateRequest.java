package com.deerplatform.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class CategoryCreateRequest {
    
    @NotBlank(message = "分类名称不能为空")
    @Size(max = 50, message = "分类名称长度不能超过50个字符")
    private String name;
    
    @Size(max = 500, message = "分类描述长度不能超过500个字符")
    private String description;
    
    @Size(max = 100, message = "图标URL长度不能超过100个字符")
    private String icon;
}