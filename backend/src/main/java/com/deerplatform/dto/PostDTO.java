package com.deerplatform.dto;

import com.deerplatform.entity.Post;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostDTO {
    private Long id;
    private String title;
    private String content;
    private String summary;
    private Integer viewCount;  // 改为Integer
    private Integer likeCount;  // 改为Integer
    private Integer commentCount;  // 改为Integer
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // 作者信息
    private UserDTO author;
    
    // 分类信息
    private CategoryDTO category;
    
    public static PostDTO fromEntity(Post post) {
        return PostDTO.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .summary(post.getSummary())
                .viewCount(post.getViewCount())
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .status(post.getStatus().name())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .author(UserDTO.fromEntity(post.getAuthor()))
                .category(CategoryDTO.fromEntity(post.getCategory()))
                .build();
    }
}