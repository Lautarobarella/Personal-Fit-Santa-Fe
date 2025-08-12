package com.personalfit.controllers;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.personalfit.dto.Payment.PaymentRequestDTO;
import com.personalfit.dto.Payment.PaymentStatusUpdateDTO;
import com.personalfit.dto.Payment.PaymentTypeDTO;
import com.personalfit.models.Payment;
import com.personalfit.models.PaymentFile;
import com.personalfit.services.PaymentService;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

/**
 * Controlador unificado para pagos y archivos
 * Combina PaymentController y PaymentFileController
 */
@Slf4j
@RestController
@RequestMapping("/api")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    // ===== ENDPOINTS DE PAGOS =====

    /**
     * Crear nuevo pago con archivo opcional
     * Endpoint principal usado por el frontend
     */
    @PostMapping(value = "/payments/new", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> createPayment(
            @RequestPart("payment") PaymentRequestDTO paymentRequest,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        
        log.info("Creando nuevo pago: Cliente={}, Monto={}", 
                paymentRequest.getClientDni(), paymentRequest.getAmount());

        Payment createdPayment = paymentService.createPayment(paymentRequest, file);
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", createdPayment.getId());
        response.put("message", "Pago creado exitosamente");
        response.put("success", true);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Crear pago desde webhook de MercadoPago
     */
    @PostMapping("/payments/webhook/mercadopago")
    public ResponseEntity<Map<String, Object>> createPaymentFromWebhook(
            @RequestBody PaymentRequestDTO paymentRequest) {
        
        log.info("Procesando pago desde webhook: DNI={}, Monto={}", 
                paymentRequest.getClientDni(), paymentRequest.getAmount());
        
        try {
            paymentService.createWebhookPayment(paymentRequest);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Pago registrado exitosamente desde webhook");
            response.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error procesando webhook: {}", e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error al registrar pago: " + e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Obtener todos los pagos (para admin)
     */
    @GetMapping("/payments/getAll")
    public ResponseEntity<List<PaymentTypeDTO>> getAllPayments() {
        List<PaymentTypeDTO> payments = paymentService.getAllPayments();
        return ResponseEntity.ok(payments);
    }

    /**
     * Obtener pagos de un usuario específico
     */
    @GetMapping("/payments/{userId}")
    public ResponseEntity<List<PaymentTypeDTO>> getUserPayments(@PathVariable Long userId) {
        List<PaymentTypeDTO> payments = paymentService.getUserPayments(userId);
        return ResponseEntity.ok(payments);
    }

    /**
     * Obtener detalles de un pago específico
     */
    @GetMapping("/payments/info/{paymentId}")
    public ResponseEntity<PaymentTypeDTO> getPaymentDetails(@PathVariable Long paymentId) {
        PaymentTypeDTO payment = paymentService.getPaymentDetails(paymentId);
        return ResponseEntity.ok(payment);
    }

    /**
     * Actualizar estado de un pago (aprobar/rechazar)
     */
    @PutMapping("/payments/pending/{paymentId}")
    public ResponseEntity<Map<String, Object>> updatePaymentStatus(
            @PathVariable Long paymentId,
            @Valid @RequestBody PaymentStatusUpdateDTO statusUpdate) {
        
        log.info("Actualizando estado de pago: ID={}, Nuevo Estado={}", 
                paymentId, statusUpdate.getStatus());
        
        paymentService.updatePaymentStatus(paymentId, statusUpdate);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Estado actualizado correctamente");
        response.put("paymentId", paymentId);
        response.put("newStatus", statusUpdate.getStatus());
        
        return ResponseEntity.ok(response);
    }

    // ===== ENDPOINTS DE ARCHIVOS =====

    /**
     * Descargar archivo de comprobante
     */
    @GetMapping("/files/{fileId}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long fileId) {
        log.info("Descargando archivo: ID={}", fileId);
        
        byte[] fileContent = paymentService.getFileContent(fileId);
        PaymentFile fileInfo = paymentService.getPaymentFileInfo(fileId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=" + fileInfo.getFileName())
                .contentType(MediaType.parseMediaType(fileInfo.getContentType()))
                .body(fileContent);
    }

    /**
     * Obtener archivo de un pago específico (para verificación)
     */
    @GetMapping("/payments/getFile/{paymentId}")
    public ResponseEntity<byte[]> getPaymentFile(@PathVariable Long paymentId) {
        log.info("Obteniendo archivo de pago: ID={}", paymentId);
        
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
}
