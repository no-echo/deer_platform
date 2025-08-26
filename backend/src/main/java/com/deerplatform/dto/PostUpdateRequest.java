package com.deerplatform.dto;

import lombok.Data;

import javax.validation.constraints.Size;

@Data
public class PostUpdateRequest {
    
    @Size(max = 200, message = "标题长度不能超过200个字符")
    private String title;
    
    @Size(max = 10000, message = "内容长度不能超过10000个字符")
    private String content;
    
    private Long categoryId;
}