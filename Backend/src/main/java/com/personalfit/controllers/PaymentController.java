package com.personalfit.controllers;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.personalfit.dto.Payment.MonthlyRevenueDTO;
import com.personalfit.dto.Payment.PaymentRequestDTO;
import com.personalfit.dto.Payment.PaymentStatusUpdateDTO;
import com.personalfit.dto.Payment.PaymentTypeDTO;
import com.personalfit.models.Payment;
import com.personalfit.models.PaymentFile;
import com.personalfit.services.PaymentService;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

/**
 * Controller for Payment & Financial Management.
 * Handles payment processing (Manual, Batch, Webhooks), file uploads
 * (receipts), and revenue statistics.
 */
@Slf4j
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    // ========================
    // PAYMENT ENDPOINTS
    // ========================

    /**
     * Create a new payment (Optional receipt file upload).
     * Main endpoint used by Frontend.
     */
    @PostMapping(value = "/new", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> createPayment(
            @RequestPart("payment") PaymentRequestDTO paymentRequest,
            @RequestPart(value = "file", required = false) MultipartFile file) {

        log.info("Creating new payment: Client={}, Amount={}",
                paymentRequest.getClientDni(), paymentRequest.getAmount());

        Payment createdPayment = paymentService.createPayment(paymentRequest, file);

        Map<String, Object> response = new HashMap<>();
        response.put("id", createdPayment.getId());
        response.put("message", "Payment created successfully");
        response.put("success", true);

        return ResponseEntity.ok(response);
    }

    /**
     * Create multiple payments in batch (Admin only).
     */
    @PostMapping("/batch")
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> createBatchPayments(
            @Valid @RequestBody List<PaymentRequestDTO> paymentRequests) {

        log.info("Batch payment creation: {} items requested", paymentRequests.size());

        Integer createdCount = paymentService.createBatchPayments(paymentRequests);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Batch payments created successfully");
        response.put("createdCount", createdCount);
        response.put("requestedCount", paymentRequests.size());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Webhook Endpoint for MercadoPago Integration.
     * Receives payment notifications automatically.
     */
    @PostMapping("/webhook/mercadopago")
    public ResponseEntity<Map<String, Object>> createPaymentFromWebhook(
            @RequestBody PaymentRequestDTO paymentRequest) {

        log.info("Webhook received: DNI={}, Amount={}",
                paymentRequest.getClientDni(), paymentRequest.getAmount());

        try {
            paymentService.createWebhookPayment(paymentRequest);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Payment registered via webhook");
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Webhook processing error: {}", e.getMessage());

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error registering payment: " + e.getMessage());
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Get all payments (Admin view).
     */
    @GetMapping("/getAll")
    public ResponseEntity<List<PaymentTypeDTO>> getAllPayments() {
        List<PaymentTypeDTO> payments = paymentService.getAllPayments();
        return ResponseEntity.ok(payments);
    }

    /**
     * Get payments filtered by Month and Year (Admin view).
     */
    @GetMapping("/getAll/{year}/{month}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PaymentTypeDTO>> getPaymentsByMonthAndYear(
            @PathVariable Integer year,
            @PathVariable Integer month) {

        log.info("Fetching payments for {}/{}", month, year);
        List<PaymentTypeDTO> payments = paymentService.getPaymentsByMonthAndYear(year, month);
        return ResponseEntity.ok(payments);
    }

    /**
     * Get payments for a specific user.
     */
    @GetMapping("/{userId}")
    public ResponseEntity<List<PaymentTypeDTO>> getUserPayments(@PathVariable Long userId) {
        List<PaymentTypeDTO> payments = paymentService.getUserPayments(userId);
        return ResponseEntity.ok(payments);
    }

    /**
     * Get details of a single payment.
     */
    @GetMapping("/info/{paymentId}")
    public ResponseEntity<PaymentTypeDTO> getPaymentDetails(@PathVariable Long paymentId) {
        PaymentTypeDTO payment = paymentService.getPaymentDetails(paymentId);
        return ResponseEntity.ok(payment);
    }

    /**
     * Update payment status (e.g., Approve/Reject a pending cash payment).
     */
    @PutMapping("/pending/{paymentId}")
    public ResponseEntity<Map<String, Object>> updatePaymentStatus(
            @PathVariable Long paymentId,
            @Valid @RequestBody PaymentStatusUpdateDTO statusUpdate) {

        log.info("Updating payment status: ID={}, New Status={}",
                paymentId, statusUpdate.getStatus());

        paymentService.updatePaymentStatus(paymentId, statusUpdate);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Status updated successfully");
        response.put("paymentId", paymentId);
        response.put("newStatus", statusUpdate.getStatus());

        return ResponseEntity.ok(response);
    }

    // ========================
    // FILE ENDPOINTS
    // ========================

    /**
     * Download a payment receipt/proof file.
     */
    @GetMapping("/files/{fileId}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long fileId) {
        log.info("Downloading file: ID={}", fileId);

        byte[] fileContent = paymentService.getFileContent(fileId);
        PaymentFile fileInfo = paymentService.getPaymentFileInfo(fileId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=" + fileInfo.getFileName())
                .contentType(MediaType.parseMediaType(fileInfo.getContentType()))
                .body(fileContent);
    }

    /**
     * Get file associated with a payment (for verification).
     */
    @GetMapping("/getFile/{paymentId}")
    public ResponseEntity<byte[]> getPaymentFile(@PathVariable Long paymentId) {
        log.info("Fetching file for payment: ID={}", paymentId);

        Payment payment = paymentService.getPaymentWithFile(paymentId);

        if (payment.getPaymentFile() == null) {
            return ResponseEntity.notFound().build();
        }

        PaymentFile file = payment.getPaymentFile();
        byte[] fileContent = paymentService.getFileContent(file.getId());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + file.getFileName())
                .contentType(MediaType.parseMediaType(file.getContentType()))
                .body(fileContent);
    }

    // ========================
    // REVENUE ENDPOINTS
    // ========================

    /**
     * Get Current Month Revenue stats (Admin only).
     */
    @GetMapping("/revenue/current")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MonthlyRevenueDTO> getCurrentMonthRevenue() {
        log.info("Fetching current month revenue");
        MonthlyRevenueDTO currentRevenue = paymentService.getCurrentMonthRevenue();
        return ResponseEntity.ok(currentRevenue);
    }

    /**
     * Get Historical Monthly Revenue stats (Admin only).
     */
    @GetMapping("/revenue/history")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MonthlyRevenueDTO>> getArchivedMonthlyRevenues() {
        log.info("Fetching revenue history");
        List<MonthlyRevenueDTO> archivedRevenues = paymentService.getArchivedMonthlyRevenues();
        return ResponseEntity.ok(archivedRevenues);
    }
}
