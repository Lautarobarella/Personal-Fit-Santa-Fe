package com.personalfit.personalfit;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class PersonalFitApplicationTests {

    @Test
    void contextLoads() {
        // Verifica que el contexto de Spring se carga correctamente
    }
}