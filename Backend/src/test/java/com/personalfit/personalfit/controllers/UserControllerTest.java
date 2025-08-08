package com.personalfit.personalfit.controllers;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class UserControllerTest {

    @Test
    void contextLoads() {
        // Test básico para verificar que el contexto se carga
        assertTrue(true);
    }

    @Test
    void basicTest() {
        // Test básico para verificar que los tests funcionan
        assertTrue(1 + 1 == 2);
    }
}