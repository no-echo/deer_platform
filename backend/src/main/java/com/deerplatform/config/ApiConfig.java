package com.deerplatform.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class ApiConfig implements WebMvcConfigurer {

    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        // 为所有REST控制器添加/api前缀
        configurer.addPathPrefix("/api", c -> c.getPackageName().startsWith("com.deerplatform.controller"));
    }
}