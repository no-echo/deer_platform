package com.deerplatform.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileService {
    
    @Value("${file.upload.path}")
    private String uploadPath;
    
    @Value("${file.upload.avatar-path}")
    private String avatarPath;
    
    @Value("${file.upload.post-images-path}")
    private String postImagesPath;
    
    /**
     * 上传头像
     */
    public String uploadAvatar(MultipartFile file) throws IOException {
        validateImageFile(file);
        return saveFile(file, avatarPath, "avatar");
    }
    
    /**
     * 上传帖子图片
     */
    public String uploadPostImage(MultipartFile file) throws IOException {
        validateImageFile(file);
        return saveFile(file, postImagesPath, "post");
    }
    
    /**
     * 批量上传帖子图片
     */
    public String[] uploadPostImages(MultipartFile[] files) throws IOException {
        String[] urls = new String[files.length];
        for (int i = 0; i < files.length; i++) {
            urls[i] = uploadPostImage(files[i]);
        }
        return urls;
    }
    
    /**
     * 删除文件
     */
    public boolean deleteFile(String filePath) {
        try {
            Path path = Paths.get(uploadPath + filePath);
            return Files.deleteIfExists(path);
        } catch (IOException e) {
            return false;
        }
    }
    
    /**
     * 验证图片文件
     */
    private void validateImageFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("文件不能为空");
        }
        
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("只能上传图片文件");
        }
        
        // 限制文件大小为5MB
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("文件大小不能超过5MB");
        }
    }
    
    /**
     * 保存文件
     */
    private String saveFile(MultipartFile file, String targetPath, String prefix) throws IOException {
        // 生成唯一文件名
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String fileName = prefix + "_" + dateStr + "_" + UUID.randomUUID().toString() + extension;
        
        // 创建目标目录
        File targetDir = new File(targetPath);
        if (!targetDir.exists()) {
            targetDir.mkdirs();
        }
        
        // 保存文件
        Path filePath = Paths.get(targetPath, fileName);
        Files.copy(file.getInputStream(), filePath);
        
        // 返回相对路径
        return filePath.toString().replace(uploadPath, "").replace("\\", "/");
    }
}