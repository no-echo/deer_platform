package com.deerplatform;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.ResultSet;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
public class DatabaseConnectionTest {

    @Autowired
    private DataSource dataSource;

    @Test
    public void testDatabaseConnection() {
        assertNotNull(dataSource, "数据源不应为空");
        
        try (Connection connection = dataSource.getConnection()) {
            assertNotNull(connection, "数据库连接不应为空");
            assertFalse(connection.isClosed(), "数据库连接应该是打开的");
            
            DatabaseMetaData metaData = connection.getMetaData();
            System.out.println("=== 数据库连接信息 ===");
            System.out.println("数据库产品名称: " + metaData.getDatabaseProductName());
            System.out.println("数据库版本: " + metaData.getDatabaseProductVersion());
            System.out.println("驱动名称: " + metaData.getDriverName());
            System.out.println("驱动版本: " + metaData.getDriverVersion());
            System.out.println("连接URL: " + metaData.getURL());
            System.out.println("用户名: " + metaData.getUserName());
            System.out.println("====================");
            
            // 验证是否为MySQL数据库
            assertTrue(metaData.getDatabaseProductName().toLowerCase().contains("mysql"), 
                      "应该连接到MySQL数据库");
            
        } catch (SQLException e) {
            fail("数据库连接失败: " + e.getMessage());
        }
    }
    
    @Test
    public void testDatabaseSchema() {
        try (Connection connection = dataSource.getConnection()) {
            // 测试是否能执行简单的SQL查询
            Statement statement = connection.createStatement();
            ResultSet resultSet = statement.executeQuery("SELECT 1 as test_value");
            
            assertTrue(resultSet.next(), "应该能执行简单的SQL查询");
            assertEquals(1, resultSet.getInt("test_value"), "查询结果应该正确");
            
            System.out.println("✅ SQL查询测试通过");
            
        } catch (SQLException e) {
            fail("SQL查询测试失败: " + e.getMessage());
        }
    }
    
    @Test
    public void testDatabaseExists() {
        try (Connection connection = dataSource.getConnection()) {
            // 检查deer_platform数据库是否存在
            Statement statement = connection.createStatement();
            ResultSet resultSet = statement.executeQuery("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'deer_platform'");
            
            assertTrue(resultSet.next(), "deer_platform数据库应该存在");
            assertEquals("deer_platform", resultSet.getString("SCHEMA_NAME"), "数据库名称应该匹配");
            
            System.out.println("✅ deer_platform数据库存在");
            
        } catch (SQLException e) {
            fail("数据库存在性检查失败: " + e.getMessage());
        }
    }
}