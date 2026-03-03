package com.personalfit.controllers;

import com.personalfit.exceptions.BusinessRuleException;
import com.personalfit.exceptions.EntityAlreadyExistsException;
import com.personalfit.exceptions.EntityNotFoundException;
import com.personalfit.exceptions.FileException;
import com.personalfit.services.ActivityService;
import com.personalfit.services.PaymentService;
import com.personalfit.services.UserService;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests for GlobalExceptionController.
 * Verifies that custom exceptions produce correctly structured error responses.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class GlobalExceptionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private ActivityService activityService;

    @MockitoBean
    private PaymentService paymentService;

    @Test
    @DisplayName("EntityNotFoundException should return 404 with structured error")
    void entityNotFound_Returns404() throws Exception {
        when(userService.getAllUsers())
                .thenThrow(new EntityNotFoundException("User not found", "/api/users/getAll"));

        mockMvc.perform(get("/api/users/getAll")
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("EntityNotFoundException"))
                .andExpect(jsonPath("$.message").value("User not found"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @DisplayName("EntityAlreadyExistsException should return 409")
    void entityAlreadyExists_Returns409() throws Exception {
        when(userService.getAllUsers())
                .thenThrow(new EntityAlreadyExistsException("User already exists", "/api/users"));

        mockMvc.perform(get("/api/users/getAll")
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("EntityAlreadyExistsException"));
    }

    @Test
    @DisplayName("BusinessRuleException should return 400")
    void businessRule_Returns400() throws Exception {
        when(userService.getAllUsers())
                .thenThrow(new BusinessRuleException("Cannot enroll in full class", "/api/activities"));

        mockMvc.perform(get("/api/users/getAll")
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Cannot enroll in full class"));
    }

    @Test
    @DisplayName("FileException should return 400")
    void fileException_Returns400() throws Exception {
        when(paymentService.getAllPayments())
                .thenThrow(new FileException("Invalid file format", "/api/payments"));

        mockMvc.perform(get("/api/payments/getAll")
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("FileException"));
    }

    @Test
    @DisplayName("Generic Exception should return 500 with generic message")
    void genericException_Returns500() throws Exception {
        when(activityService.getAllActivitiesTypeDto())
                .thenThrow(new RuntimeException("Unexpected DB error"));

        mockMvc.perform(get("/api/activities/getAll")
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.message").value("Internal server error"));
    }
}
