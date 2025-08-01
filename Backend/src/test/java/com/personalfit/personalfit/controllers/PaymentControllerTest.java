package com.personalfit.personalfit.controllers;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.ArrayList;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.personalfit.personalfit.dto.PaymentTypeDTO;
import com.personalfit.personalfit.services.IPaymentService;
import com.personalfit.personalfit.services.IPaymentFileService;

@WebMvcTest(PaymentController.class)
@ActiveProfiles("test")
class PaymentControllerTest {

    @MockBean
    private IPaymentFileService paymentFileService;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private IPaymentService paymentService;

    private PaymentTypeDTO testPaymentDTO;

    @BeforeEach
    void setUp() {
        testPaymentDTO = PaymentTypeDTO.builder()
                .id(1L)
                .amount(100.0)
                .build();
    }

    @Test
    void testGetAllPayments() throws Exception {
        when(paymentService.getAllPaymentsTypeDto()).thenReturn(new ArrayList<>());
        
        mockMvc.perform(get("/api/payments"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetPaymentById() throws Exception {
        when(paymentService.getPaymentById(1L)).thenReturn(testPaymentDTO);

        mockMvc.perform(get("/api/payments/1"))
                .andExpect(status().isOk());
    }
} 