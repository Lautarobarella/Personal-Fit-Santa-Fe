package com.personalfit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Smoke test that verifies the Spring application context loads successfully.
 * If this fails, nothing else will work in production.
 */
@SpringBootTest
@ActiveProfiles("test")
class PersonalFitApplicationTests {

    @Test
    @DisplayName("Application context should load successfully")
    void contextLoads() {
        // If the application context cannot start, this test will fail
    }
}
