package com.personalfit.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.personalfit.dto.Payment.MonthlyRevenueDTO;
import com.personalfit.dto.Payment.PaymentRequestDTO;
import com.personalfit.dto.Payment.PaymentStatusUpdateDTO;
import com.personalfit.dto.Payment.PaymentTypeDTO;
import com.personalfit.enums.MethodType;
import com.personalfit.enums.PaymentStatus;
import com.personalfit.models.PaymentFile;
import com.personalfit.services.PaymentService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests for PaymentController.
 * Covers payment CRUD, batch creation, status updates, file downloads, and revenue analytics.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @MockitoBean
    private PaymentService paymentService;

    private PaymentTypeDTO samplePaymentDTO;

    @BeforeEach
    void setUp() {
        samplePaymentDTO = PaymentTypeDTO.builder()
                .id(1L)
                .clientId(10L)
                .clientName("Juan Perez")
                .amount(25000.0)
                .status(PaymentStatus.PENDING)
                .method(MethodType.CASH)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(30))
                .build();
    }

    @Nested
    @DisplayName("GET /api/payments/getAll")
    class GetAllPaymentsTests {

        @Test
        @DisplayName("should return all payments")
        void getAllPayments_ReturnsList() throws Exception {
            PaymentTypeDTO payment2 = PaymentTypeDTO.builder()
                    .id(2L)
                    .clientName("Ana Gomez")
                    .amount(25000.0)
                    .status(PaymentStatus.PAID)
                    .method(MethodType.CARD)
                    .build();

            when(paymentService.getAllPayments()).thenReturn(Arrays.asList(samplePaymentDTO, payment2));

            mockMvc.perform(get("/api/payments/getAll")
                            .with(user("admin").roles("ADMIN")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].clientName").value("Juan Perez"))
                    .andExpect(jsonPath("$[1].clientName").value("Ana Gomez"));
        }
    }

    @Nested
    @DisplayName("GET /api/payments/getAll/{year}/{month}")
    class GetPaymentsByMonthTests {

        @Test
        @DisplayName("should return payments filtered by month and year")
        void getPaymentsByMonth_AdminRole_ReturnsList() throws Exception {
            when(paymentService.getPaymentsByMonthAndYear(2026, 3))
                    .thenReturn(List.of(samplePaymentDTO));

            mockMvc.perform(get("/api/payments/getAll/2026/3")
                            .with(user("admin").roles("ADMIN")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1));
        }

        @Test
        @DisplayName("should deny access for non-admin users")
        void getPaymentsByMonth_ClientRole_Returns403() throws Exception {
            mockMvc.perform(get("/api/payments/getAll/2026/3")
                            .with(user("client").roles("CLIENT")))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/payments/{userId}")
    class GetUserPaymentsTests {

        @Test
        @DisplayName("should return user's payments")
        void getUserPayments_ValidId_ReturnsList() throws Exception {
            when(paymentService.getUserPayments(10L)).thenReturn(List.of(samplePaymentDTO));

            mockMvc.perform(get("/api/payments/10")
                            .with(user("client").roles("CLIENT")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].clientName").value("Juan Perez"));
        }
    }

    @Nested
    @DisplayName("GET /api/payments/info/{paymentId}")
    class GetPaymentDetailsTests {

        @Test
        @DisplayName("should return payment details")
        void getPaymentDetails_ValidId_ReturnsPayment() throws Exception {
            when(paymentService.getPaymentDetails(1L)).thenReturn(samplePaymentDTO);

            mockMvc.perform(get("/api/payments/info/1")
                            .with(user("admin").roles("ADMIN")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.clientName").value("Juan Perez"))
                    .andExpect(jsonPath("$.amount").value(25000.0))
                    .andExpect(jsonPath("$.status").value("PENDING"));
        }
    }

    @Nested
    @DisplayName("PUT /api/payments/pending/{paymentId}")
    class UpdatePaymentStatusTests {

        @Test
        @DisplayName("should update payment status to PAID")
        void updateStatus_Approve_ReturnsOk() throws Exception {
            PaymentStatusUpdateDTO statusUpdate = PaymentStatusUpdateDTO.builder()
                    .status("PAID")
                    .build();

            doNothing().when(paymentService).updatePaymentStatus(eq(1L), any(PaymentStatusUpdateDTO.class));

            mockMvc.perform(put("/api/payments/pending/1")
                            .with(user("admin").roles("ADMIN"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(statusUpdate)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.newStatus").value("PAID"));
        }

        @Test
        @DisplayName("should update payment status to REJECTED with reason")
        void updateStatus_Reject_WithReason_ReturnsOk() throws Exception {
            PaymentStatusUpdateDTO statusUpdate = PaymentStatusUpdateDTO.builder()
                    .status("REJECTED")
                    .rejectionReason("Comprobante inválido")
                    .build();

            doNothing().when(paymentService).updatePaymentStatus(eq(1L), any(PaymentStatusUpdateDTO.class));

            mockMvc.perform(put("/api/payments/pending/1")
                            .with(user("admin").roles("ADMIN"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(statusUpdate)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.newStatus").value("REJECTED"));
        }
    }

    @Nested
    @DisplayName("Batch Payments")
    class BatchPaymentTests {

        @Test
        @DisplayName("POST /api/payments/batch - should create batch payments (Admin only)")
        void createBatch_AdminRole_Returns201() throws Exception {
            PaymentRequestDTO req = PaymentRequestDTO.builder()
                    .clientDni(12345678)
                    .amount(25000.0)
                    .methodType(MethodType.CASH)
                    .paymentStatus(PaymentStatus.PENDING)
                    .build();

            when(paymentService.createBatchPayments(anyList(), anyString())).thenReturn(3);

            mockMvc.perform(post("/api/payments/batch")
                            .with(user("admin").roles("ADMIN"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(List.of(req, req, req))))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.createdCount").value(3));
        }

        @Test
        @DisplayName("POST /api/payments/batch - should deny non-admin")
        void createBatch_ClientRole_Returns403() throws Exception {
            mockMvc.perform(post("/api/payments/batch")
                            .with(user("client").roles("CLIENT"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("[]"))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("File Downloads")
    class FileDownloadTests {

        @Test
        @DisplayName("GET /api/payments/files/{fileId} - should download file without auth")
        void downloadFile_NoAuth_ReturnsFile() throws Exception {
            byte[] content = "fake-file-content".getBytes();
            PaymentFile fileInfo = new PaymentFile();
            fileInfo.setFileName("receipt.pdf");
            fileInfo.setContentType("application/pdf");

            when(paymentService.getFileContent(1L)).thenReturn(content);
            when(paymentService.getPaymentFileInfo(1L)).thenReturn(fileInfo);

            mockMvc.perform(get("/api/payments/files/1"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Content-Disposition", "inline; filename=receipt.pdf"))
                    .andExpect(content().contentType(MediaType.APPLICATION_PDF));
        }
    }

    @Nested
    @DisplayName("Revenue Endpoints")
    class RevenueTests {

        @Test
        @DisplayName("GET /api/payments/revenue/current - should return current month revenue")
        void getCurrentRevenue_Admin_ReturnsRevenue() throws Exception {
            MonthlyRevenueDTO revenue = MonthlyRevenueDTO.builder()
                    .year(2026)
                    .month(3)
                    .monthName("marzo")
                    .totalRevenue(150000.0)
                    .totalPayments(6)
                    .isCurrentMonth(true)
                    .build();

            when(paymentService.getCurrentMonthRevenue()).thenReturn(revenue);

            mockMvc.perform(get("/api/payments/revenue/current")
                            .with(user("admin").roles("ADMIN")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.totalRevenue").value(150000.0))
                    .andExpect(jsonPath("$.totalPayments").value(6))
                    .andExpect(jsonPath("$.isCurrentMonth").value(true));
        }

        @Test
        @DisplayName("GET /api/payments/revenue/history - should return archived revenues")
        void getRevenueHistory_Admin_ReturnsList() throws Exception {
            MonthlyRevenueDTO jan = MonthlyRevenueDTO.builder()
                    .year(2026).month(1).monthName("enero").totalRevenue(120000.0).build();
            MonthlyRevenueDTO feb = MonthlyRevenueDTO.builder()
                    .year(2026).month(2).monthName("febrero").totalRevenue(135000.0).build();

            when(paymentService.getArchivedMonthlyRevenues()).thenReturn(Arrays.asList(jan, feb));

            mockMvc.perform(get("/api/payments/revenue/history")
                            .with(user("admin").roles("ADMIN")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2));
        }

        @Test
        @DisplayName("GET /api/payments/revenue/current - should deny non-admin")
        void getCurrentRevenue_Client_Returns403() throws Exception {
            mockMvc.perform(get("/api/payments/revenue/current")
                            .with(user("client").roles("CLIENT")))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("Security Tests")
    class SecurityTests {

        @Test
        @DisplayName("should require authentication for payment list")
        void protectedEndpoint_NoAuth_Returns401() throws Exception {
            mockMvc.perform(get("/api/payments/getAll"))
                    .andExpect(status().isUnauthorized());
        }
    }
}
