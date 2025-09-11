package com.deerplatform.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 配置静态资源映射 - 指向项目根目录的frontend文件夹
        registry.addResourceHandler("/**")
                .addResourceLocations("file:../frontend/")
                .setCachePeriod(0); // 开发环境不缓存
        
        // 配置上传文件访问
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/")
                .setCachePeriod(3600); // 上传文件缓存1小时
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // 默认首页重定向
        registry.addViewController("/").setViewName("forward:/index.html");
    }
}