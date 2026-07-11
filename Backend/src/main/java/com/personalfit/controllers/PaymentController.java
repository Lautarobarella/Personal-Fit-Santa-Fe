package com.personalfit.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.personalfit.dto.Payment.InactiveClientsPaymentRequestDTO;
import com.personalfit.dto.Payment.ManualPaymentRequestDTO;
import com.personalfit.dto.Payment.PaymentStatusUpdateDTO;
import com.personalfit.dto.Payment.PaymentTypeDTO;
import com.personalfit.models.Payment;
import com.personalfit.models.PaymentFile;
import com.personalfit.services.PaymentService;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

/**
 * Controller for Payment & Financial Management.
 * Handles payment processing (Manual, Batch, Webhooks) and file uploads
 * (receipts).
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
    @PreAuthorize("hasRole('CLIENT') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> createPayment(
            @Valid @RequestPart("payment") ManualPaymentRequestDTO paymentRequest,
            @RequestPart(value = "file", required = false) MultipartFile file,
            Authentication authentication) {

        log.info("Creating new payment: requestedClients={}", paymentRequest.getClientDnis().size());

        Payment createdPayment = paymentService.createPayment(paymentRequest, file, authentication.getName());

        Map<String, Object> response = new HashMap<>();
        response.put("id", createdPayment.getId());
        response.put("message", "Payment created successfully");
        response.put("success", true);

        return ResponseEntity.ok(response);
    }

    /**
     * Quick payment load for inactive clients (Admin only).
     * Creates ONE auto-confirmed group payment for the selected inactive
     * clients; creator, amount and status are resolved server-side.
     */
    @PostMapping("/inactive-group")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> createInactiveClientsPayment(
            @Valid @RequestBody InactiveClientsPaymentRequestDTO request,
            Authentication authentication) {

        log.info("Inactive-clients payment creation: {} clients requested",
                request.getClientDnis() != null ? request.getClientDnis().size() : 0);

        Payment payment = paymentService.createInactiveClientsPayment(request, authentication.getName());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Pago generado exitosamente");
        response.put("paymentId", payment.getId());
        response.put("clientCount", payment.getUsers().size());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all payments (Admin view).
     */
    @GetMapping("/getAll")
    @PreAuthorize("hasRole('ADMIN')")
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

        log.debug("Fetching payments for {}/{}", month, year);
        List<PaymentTypeDTO> payments = paymentService.getPaymentsByMonthAndYear(year, month);
        return ResponseEntity.ok(payments);
    }

    /**
     * Get payments for a specific user.
     */
    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('ADMIN')")
    public ResponseEntity<List<PaymentTypeDTO>> getUserPayments(@PathVariable Long userId,
            Authentication authentication) {
        List<PaymentTypeDTO> payments = paymentService.getUserPayments(userId, authentication.getName());
        return ResponseEntity.ok(payments);
    }

    /**
     * Get details of a single payment.
     */
    @GetMapping("/info/{paymentId}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('ADMIN')")
    public ResponseEntity<PaymentTypeDTO> getPaymentDetails(@PathVariable Long paymentId,
            Authentication authentication) {
        PaymentTypeDTO payment = paymentService.getPaymentDetails(paymentId, authentication.getName());
        return ResponseEntity.ok(payment);
    }

    /**
     * Update payment status (e.g., Approve/Reject a pending cash payment).
     */
    @PutMapping("/pending/{paymentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> updatePaymentStatus(
            @PathVariable Long paymentId,
            @Valid @RequestBody PaymentStatusUpdateDTO statusUpdate,
            Authentication authentication) {

        log.info("Updating payment status: ID={}, New Status={}",
                paymentId, statusUpdate.getStatus());

        paymentService.updatePaymentStatus(paymentId, statusUpdate, authentication.getName());

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
    @PreAuthorize("hasRole('CLIENT') or hasRole('ADMIN')")
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long fileId, Authentication authentication) {
        log.debug("Downloading file: id={}", fileId);

        PaymentFile fileInfo = paymentService.getAuthorizedPaymentFile(fileId, authentication.getName());
        byte[] fileContent = paymentService.getFileContent(fileInfo);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=" + fileInfo.getFileName())
                .contentType(MediaType.parseMediaType(fileInfo.getContentType()))
                .body(fileContent);
    }

    /**
     * Get file associated with a payment (for verification).
     */
    @GetMapping("/getFile/{paymentId}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('ADMIN')")
    public ResponseEntity<byte[]> getPaymentFile(@PathVariable Long paymentId, Authentication authentication) {
        log.debug("Fetching file for payment: id={}", paymentId);

        Payment payment = paymentService.getAuthorizedPaymentWithFile(paymentId, authentication.getName());

        if (payment.getPaymentFile() == null) {
            return ResponseEntity.notFound().build();
        }

        PaymentFile file = payment.getPaymentFile();
        byte[] fileContent = paymentService.getFileContent(file);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + file.getFileName())
                .contentType(MediaType.parseMediaType(file.getContentType()))
                .body(fileContent);
    }

}
