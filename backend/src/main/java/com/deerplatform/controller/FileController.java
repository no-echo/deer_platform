package com.deerplatform.controller;

import com.deerplatform.entity.User;
import com.deerplatform.service.FileService;
import com.deerplatform.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FileController {
    
    private final FileService fileService;
    
    /**
     * 上传头像
     */
    @PostMapping("/avatar")
    public ResponseEntity<Map<String, Object>> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User currentUser) {
        try {
            String filePath = fileService.uploadAvatar(file);
            String fileUrl = "/uploads" + filePath;
            
            Map<String, Object> data = new HashMap<>();
            data.put("url", fileUrl);
            data.put("path", filePath);
            
            return ResponseEntity.ok(ResponseUtil.success("头像上传成功", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("头像上传失败: " + e.getMessage()));
        }
    }
    
    /**
     * 上传帖子图片
     */
    @PostMapping("/post-image")
    public ResponseEntity<Map<String, Object>> uploadPostImage(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User currentUser) {
        try {
            String filePath = fileService.uploadPostImage(file);
            String fileUrl = "/uploads" + filePath;
            
            Map<String, Object> data = new HashMap<>();
            data.put("url", fileUrl);
            data.put("path", filePath);
            
            return ResponseEntity.ok(ResponseUtil.success("图片上传成功", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("图片上传失败: " + e.getMessage()));
        }
    }
    
    /**
     * 批量上传帖子图片
     */
    @PostMapping("/post-images")
    public ResponseEntity<Map<String, Object>> uploadPostImages(
            @RequestParam("files") MultipartFile[] files,
            @AuthenticationPrincipal User currentUser) {
        try {
            String[] filePaths = fileService.uploadPostImages(files);
            String[] fileUrls = new String[filePaths.length];
            
            for (int i = 0; i < filePaths.length; i++) {
                fileUrls[i] = "/uploads" + filePaths[i];
            }
            
            Map<String, Object> data = new HashMap<>();
            data.put("urls", fileUrls);
            data.put("paths", filePaths);
            
            return ResponseEntity.ok(ResponseUtil.success("图片批量上传成功", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("图片批量上传失败: " + e.getMessage()));
        }
    }
    
    /**
     * 删除文件
     */
    @DeleteMapping
    public ResponseEntity<Map<String, Object>> deleteFile(
            @RequestParam("path") String filePath,
            @AuthenticationPrincipal User currentUser) {
        try {
            boolean deleted = fileService.deleteFile(filePath);
            if (deleted) {
                return ResponseEntity.ok(ResponseUtil.success("文件删除成功", null));
            } else {
                return ResponseEntity.badRequest().body(ResponseUtil.error("文件删除失败"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseUtil.error("文件删除失败: " + e.getMessage()));
        }
    }
}