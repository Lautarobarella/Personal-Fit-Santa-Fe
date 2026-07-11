package com.personalfit.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.personalfit.dto.Payment.InactiveClientsPaymentRequestDTO;
import com.personalfit.dto.Payment.ManualPaymentRequestDTO;
import com.personalfit.dto.Payment.PaymentStatusUpdateDTO;
import com.personalfit.dto.Payment.PaymentTypeDTO;
import com.personalfit.enums.MethodType;
import com.personalfit.enums.PaymentStatus;
import com.personalfit.models.Payment;
import com.personalfit.models.PaymentFile;
import com.personalfit.models.User;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests for PaymentController.
 * Covers payment CRUD, status updates and file downloads.
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
    @DisplayName("POST /api/payments/new")
    class CreatePaymentTests {

        @Test
        @DisplayName("should deny trainer")
        void createPayment_TrainerRole_Returns403() throws Exception {
            ManualPaymentRequestDTO request = ManualPaymentRequestDTO.builder()
                    .clientDnis(List.of(30111111))
                    .expectedMonthlyFee(25000.0)
                    .methodType(MethodType.CASH)
                    .build();
            MockMultipartFile paymentPart = new MockMultipartFile(
                    "payment",
                    "",
                    MediaType.APPLICATION_JSON_VALUE,
                    objectMapper.writeValueAsBytes(request));

            mockMvc.perform(multipart("/api/payments/new")
                            .file(paymentPart)
                            .with(user("trainer").roles("TRAINER")))
                    .andExpect(status().isForbidden());

            verify(paymentService, never()).createPayment(any(), any(), anyString());
        }

        @Test
        @DisplayName("should pass the authenticated client identity to the service")
        void createPayment_ClientRole_ReturnsOk() throws Exception {
            ManualPaymentRequestDTO request = ManualPaymentRequestDTO.builder()
                    .clientDnis(List.of(30111111))
                    .expectedMonthlyFee(25000.0)
                    .methodType(MethodType.CASH)
                    .notes("Pago en recepción")
                    .build();
            MockMultipartFile paymentPart = new MockMultipartFile(
                    "payment",
                    "",
                    MediaType.APPLICATION_JSON_VALUE,
                    objectMapper.writeValueAsBytes(request));
            Payment payment = Payment.builder().id(77L).build();
            when(paymentService.createPayment(any(ManualPaymentRequestDTO.class), isNull(), eq("client@test.com")))
                    .thenReturn(payment);

            mockMvc.perform(multipart("/api/payments/new")
                            .file(paymentPart)
                            .with(user("client@test.com").roles("CLIENT")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(77));

            verify(paymentService).createPayment(any(ManualPaymentRequestDTO.class), isNull(),
                    eq("client@test.com"));
        }

        @Test
        @DisplayName("should reject a request without the expected monthly fee")
        void createPayment_MissingExpectedFee_Returns400() throws Exception {
            MockMultipartFile paymentPart = new MockMultipartFile(
                    "payment",
                    "",
                    MediaType.APPLICATION_JSON_VALUE,
                    "{\"clientDnis\":[30111111],\"methodType\":\"CASH\"}".getBytes());

            mockMvc.perform(multipart("/api/payments/new")
                            .file(paymentPart)
                            .with(user("client@test.com").roles("CLIENT")))
                    .andExpect(status().isBadRequest());

            verify(paymentService, never()).createPayment(any(), any(), anyString());
        }
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
                    .method(MethodType.TRANSFER)
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
            when(paymentService.getUserPayments(10L, "client")).thenReturn(List.of(samplePaymentDTO));

            mockMvc.perform(get("/api/payments/10")
                            .with(user("client").roles("CLIENT")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].clientName").value("Juan Perez"));
        }

        @Test
        @DisplayName("should deny a client requesting another user's history")
        void getUserPayments_OtherClientId_Returns403() throws Exception {
            when(paymentService.getUserPayments(99L, "client@test.com"))
                    .thenThrow(new AccessDeniedException("forbidden"));

            mockMvc.perform(get("/api/payments/99")
                            .with(user("client@test.com").roles("CLIENT")))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/payments/info/{paymentId}")
    class GetPaymentDetailsTests {

        @Test
        @DisplayName("should return payment details")
        void getPaymentDetails_ValidId_ReturnsPayment() throws Exception {
            when(paymentService.getPaymentDetails(1L, "admin")).thenReturn(samplePaymentDTO);

            mockMvc.perform(get("/api/payments/info/1")
                            .with(user("admin").roles("ADMIN")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.clientName").value("Juan Perez"))
                    .andExpect(jsonPath("$.amount").value(25000.0))
                    .andExpect(jsonPath("$.status").value("PENDING"));
        }

        @Test
        @DisplayName("should deny a client requesting an unrelated payment")
        void getPaymentDetails_UnrelatedClient_Returns403() throws Exception {
            when(paymentService.getPaymentDetails(1L, "other@test.com"))
                    .thenThrow(new AccessDeniedException("forbidden"));

            mockMvc.perform(get("/api/payments/info/1")
                            .with(user("other@test.com").roles("CLIENT")))
                    .andExpect(status().isForbidden());
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

            doNothing().when(paymentService).updatePaymentStatus(
                    eq(1L), any(PaymentStatusUpdateDTO.class), eq("admin"));

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

            doNothing().when(paymentService).updatePaymentStatus(
                    eq(1L), any(PaymentStatusUpdateDTO.class), eq("admin"));

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
    @DisplayName("Inactive Clients Payments")
    class InactiveClientsPaymentTests {

        @Test
        @DisplayName("POST /api/payments/inactive-group - should create confirmed group payment (Admin only)")
        void createInactiveClientsPayment_AdminRole_Returns201() throws Exception {
            InactiveClientsPaymentRequestDTO req = InactiveClientsPaymentRequestDTO.builder()
                    .clientDnis(List.of(30111111, 30222222))
                    .expectedMonthlyFee(25000.0)
                    .build();

            User admin = new User();
            admin.setId(1L);
            Payment createdPayment = Payment.builder()
                    .id(55L)
                    .amount(50000.0)
                    .status(PaymentStatus.PAID)
                    .createdBy(admin)
                    .users(Set.of(new User(), new User()))
                    .build();

            when(paymentService.createInactiveClientsPayment(any(InactiveClientsPaymentRequestDTO.class),
                    anyString())).thenReturn(createdPayment);

            mockMvc.perform(post("/api/payments/inactive-group")
                            .with(user("admin").roles("ADMIN"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.paymentId").value(55))
                    .andExpect(jsonPath("$.clientCount").value(2));

            verify(paymentService).createInactiveClientsPayment(any(InactiveClientsPaymentRequestDTO.class),
                    eq("admin"));
        }

        @Test
        @DisplayName("POST /api/payments/inactive-group - should deny non-admin")
        void createInactiveClientsPayment_ClientRole_Returns403() throws Exception {
            mockMvc.perform(post("/api/payments/inactive-group")
                            .with(user("client").roles("CLIENT"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"clientDnis\":[30111111],\"expectedMonthlyFee\":25000.0}"))
                    .andExpect(status().isForbidden());

            verify(paymentService, never()).createInactiveClientsPayment(any(), anyString());
        }

        @Test
        @DisplayName("POST /api/payments/inactive-group - should deny trainer")
        void createInactiveClientsPayment_TrainerRole_Returns403() throws Exception {
            mockMvc.perform(post("/api/payments/inactive-group")
                            .with(user("trainer").roles("TRAINER"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"clientDnis\":[30111111],\"expectedMonthlyFee\":25000.0}"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("POST /api/payments/inactive-group - should require authentication")
        void createInactiveClientsPayment_NoAuth_Returns401() throws Exception {
            mockMvc.perform(post("/api/payments/inactive-group")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"clientDnis\":[30111111],\"expectedMonthlyFee\":25000.0}"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("POST /api/payments/inactive-group - should reject empty selection")
        void createInactiveClientsPayment_EmptyDnis_Returns400() throws Exception {
            mockMvc.perform(post("/api/payments/inactive-group")
                            .with(user("admin").roles("ADMIN"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"clientDnis\":[],\"expectedMonthlyFee\":25000.0}"))
                    .andExpect(status().isBadRequest());

            verify(paymentService, never()).createInactiveClientsPayment(any(), anyString());
        }

        @Test
        @DisplayName("POST /api/payments/inactive-group - should reject missing expected fee")
        void createInactiveClientsPayment_MissingExpectedFee_Returns400() throws Exception {
            mockMvc.perform(post("/api/payments/inactive-group")
                            .with(user("admin").roles("ADMIN"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"clientDnis\":[30111111]}"))
                    .andExpect(status().isBadRequest());

            verify(paymentService, never()).createInactiveClientsPayment(any(), anyString());
        }
    }

    @Nested
    @DisplayName("File Downloads")
    class FileDownloadTests {

        @Test
        @DisplayName("GET /api/payments/files/{fileId} - should download an authorized file")
        void downloadFile_AuthorizedClient_ReturnsFile() throws Exception {
            byte[] content = "fake-file-content".getBytes();
            PaymentFile fileInfo = new PaymentFile();
            fileInfo.setFileName("receipt.pdf");
            fileInfo.setContentType("application/pdf");

            when(paymentService.getAuthorizedPaymentFile(1L, "client@test.com")).thenReturn(fileInfo);
            when(paymentService.getFileContent(fileInfo)).thenReturn(content);

            mockMvc.perform(get("/api/payments/files/1")
                            .with(user("client@test.com").roles("CLIENT")))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Content-Disposition", "inline; filename=receipt.pdf"))
                    .andExpect(content().contentType(MediaType.APPLICATION_PDF));
        }

        @Test
        @DisplayName("GET /api/payments/files/{fileId} - should require authentication")
        void downloadFile_NoAuth_Returns401() throws Exception {
            mockMvc.perform(get("/api/payments/files/1"))
                    .andExpect(status().isUnauthorized());

            verify(paymentService, never()).getAuthorizedPaymentFile(anyLong(), anyString());
        }

        @Test
        @DisplayName("GET /api/payments/files/{fileId} - should reject an unrelated client")
        void downloadFile_UnrelatedClient_Returns403() throws Exception {
            when(paymentService.getAuthorizedPaymentFile(1L, "other@test.com"))
                    .thenThrow(new AccessDeniedException("forbidden"));

            mockMvc.perform(get("/api/payments/files/1")
                            .with(user("other@test.com").roles("CLIENT")))
                    .andExpect(status().isForbidden());

            verify(paymentService, never()).getFileContent(any(PaymentFile.class));
        }

        @Test
        @DisplayName("GET /api/payments/getFile/{paymentId} - should download for an authorized participant")
        void getPaymentFile_AuthorizedClient_ReturnsFile() throws Exception {
            byte[] content = "payment-receipt".getBytes();
            PaymentFile file = PaymentFile.builder()
                    .fileName("transferencia.pdf")
                    .contentType("application/pdf")
                    .build();
            Payment payment = Payment.builder().id(9L).paymentFile(file).build();

            when(paymentService.getAuthorizedPaymentWithFile(9L, "client@test.com")).thenReturn(payment);
            when(paymentService.getFileContent(file)).thenReturn(content);

            mockMvc.perform(get("/api/payments/getFile/9")
                            .with(user("client@test.com").roles("CLIENT")))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Content-Disposition", "attachment; filename=transferencia.pdf"))
                    .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                    .andExpect(content().bytes(content));
        }

        @Test
        @DisplayName("GET /api/payments/getFile/{paymentId} - should reject an unrelated client")
        void getPaymentFile_UnrelatedClient_Returns403() throws Exception {
            when(paymentService.getAuthorizedPaymentWithFile(9L, "other@test.com"))
                    .thenThrow(new AccessDeniedException("forbidden"));

            mockMvc.perform(get("/api/payments/getFile/9")
                            .with(user("other@test.com").roles("CLIENT")))
                    .andExpect(status().isForbidden());

            verify(paymentService, never()).getFileContent(any(PaymentFile.class));
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
