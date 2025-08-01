package com.personalfit.personalfit;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class BasicBackendTest {

    @Test
    void contextLoads() {
        // Verifica que el contexto de Spring se carga correctamente
        assertTrue(true);
    }

    @Test
    void basicTest() {
        // Test básico para verificar que los tests funcionan
        assertTrue(1 + 1 == 2);
    }

    @Test
    void stringTest() {
        String test = "Hello World";
        assertTrue(test.contains("Hello"));
        assertTrue(test.length() > 0);
    }

    @Test
    void arrayTest() {
        int[] numbers = {1, 2, 3, 4, 5};
        assertTrue(numbers.length == 5);
        assertTrue(numbers[0] == 1);
        assertTrue(numbers[4] == 5);
    }
} 