package com.finflow.core;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ContextConfiguration;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

@SpringBootTest
class FinflowBackendApplicationTests {

    @Autowired
    private DataSource dataSource;

    @Test
    void contextLoads() {
    }

    @Test
    void testDatabaseConnection() throws SQLException {
        try (Connection connection = dataSource.getConnection()) {

            System.out.println("================================================");
            System.out.println("KẾT NỐI DATABASE THÀNH CÔNG!");
            System.out.println("Tên Database: " + connection.getCatalog());
            System.out.println("================================================");

            assertThat(connection).isNotNull();
            assertThat(connection.isClosed()).isFalse();
        }
    }

}
