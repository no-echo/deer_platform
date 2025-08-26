package com.deerplatform.util;

import java.util.HashMap;
import java.util.Map;

public class ResponseUtil {
    
    public static Map<String, Object> success() {
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "操作成功");
        result.put("success", true);
        return result;
    }
    
    public static Map<String, Object> success(Object data) {
        Map<String, Object> result = success();
        result.put("data", data);
        return result;
    }
    
    public static Map<String, Object> success(String message, Object data) {
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", message);
        result.put("success", true);
        result.put("data", data);
        return result;
    }
    
    public static Map<String, Object> error(String message) {
        Map<String, Object> result = new HashMap<>();
        result.put("code", 500);
        result.put("message", message);
        result.put("success", false);
        return result;
    }
    
    public static Map<String, Object> error(int code, String message) {
        Map<String, Object> result = new HashMap<>();
        result.put("code", code);
        result.put("message", message);
        result.put("success", false);
        return result;
    }
    
    public static Map<String, Object> unauthorized(String message) {
        return error(401, message);
    }
    
    public static Map<String, Object> forbidden(String message) {
        return error(403, message);
    }
    
    public static Map<String, Object> badRequest(String message) {
        return error(400, message);
    }
}