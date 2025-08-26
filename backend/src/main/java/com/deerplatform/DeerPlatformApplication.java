package com.deerplatform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class DeerPlatformApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(DeerPlatformApplication.class, args);
        System.out.println("\n==================================");
        System.out.println("🦌 林麝养殖交流分享平台启动成功！");
        System.out.println("📱 前端访问地址: http://localhost:8080");
        System.out.println("🔗 API接口地址: http://localhost:8080/api");
        System.out.println("📚 API文档地址: http://localhost:8080/api/swagger-ui.html");
        System.out.println("==================================");
    }
}