package com.personalfit.personalfit.controllers;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.personalfit.personalfit.dto.InCreatePaymentDTO;
import com.personalfit.personalfit.dto.InUpdatePaymentStatusDTO;
import com.personalfit.personalfit.dto.PaymentTypeDTO;
import com.personalfit.personalfit.models.Payment;
import com.personalfit.personalfit.models.PaymentFile;
import com.personalfit.personalfit.services.IPaymentFileService;
import com.personalfit.personalfit.services.IPaymentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private IPaymentService paymentService;

    @Autowired
    private IPaymentFileService fileService;

    // DEPRECATED
    @PostMapping
    public ResponseEntity<Map<String, Object>> newPayment(@RequestBody InCreatePaymentDTO payment) {
        paymentService.registerPayment(payment);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Pago registrado exitosamente (método deprecated)");
        response.put("success", true);
        response.put("warning", "Este endpoint está deprecated, use /new en su lugar");
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/new", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> newPaymentWithFile(
            @RequestPart("payment") InCreatePaymentDTO payment,
            @RequestPart(value = "file", required = false) MultipartFile file) {

        Payment createdPayment = paymentService.registerPaymentWithFile(payment, file);
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", createdPayment.getId());
        response.put("message", "Pago creado exitosamente");
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/webhook/mercadopago")
    public ResponseEntity<Map<String, Object>> createPaymentFromWebhook(@RequestBody InCreatePaymentDTO payment) {
        try {
            paymentService.registerWebhookPayment(payment); // Use the new method
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Pago registrado exitosamente desde webhook");
            response.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error al registrar pago: " + e.getMessage());
            response.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<PaymentTypeDTO>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPaymentsTypeDto());
    }

    @GetMapping("/info/{id}")
    public ResponseEntity<PaymentTypeDTO> getPaymentInfo(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getPaymentById(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<List<PaymentTypeDTO>> getUserPayments(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getUserPaymentsTypeDto(id));
    }

    @PutMapping("/pending/{id}")
    public ResponseEntity<Map<String, Object>> putPayment(
            @PathVariable Long id,
            @RequestBody InUpdatePaymentStatusDTO dto) {
        paymentService.updatePaymentStatus(id, dto);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Estado actualizado correctamente");
        response.put("paymentId", id);
        response.put("newStatus", dto.getStatus());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/getFile/{id}")
    public ResponseEntity<byte[]> getFile(@PathVariable Long id) {
        Payment payment = paymentService.getPaymentWithFileById(id);
        PaymentFile file = payment.getPaymentFile();
        byte[] fileBytes = fileService.getFile(file.getId());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + file.getFileName())
                .contentType(MediaType.parseMediaType(file.getContentType()))
                .body(fileBytes);
    }

    // batch function to save multiple payments
    @Transactional
    @PostMapping("/batch")
    public ResponseEntity<Void> savePayments(@Valid @RequestBody List<InCreatePaymentDTO> newPayments) {
        paymentService.saveAll(newPayments);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }

    // batch function to save multiple payments with files
    @Transactional
    @PostMapping(value = "/batch-with-files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> savePaymentsWithFiles(
            @RequestPart("payments") String paymentsJson,
            @RequestPart(value = "file1", required = false) MultipartFile file1,
            @RequestPart(value = "file2", required = false) MultipartFile file2,
            @RequestPart(value = "file3", required = false) MultipartFile file3,
            @RequestPart(value = "file4", required = false) MultipartFile file4,
            @RequestPart(value = "file5", required = false) MultipartFile file5) {
        
        try {
            System.out.println("Received payments JSON: " + paymentsJson);
            System.out.println("File1: " + (file1 != null ? file1.getOriginalFilename() : "null"));
            System.out.println("File2: " + (file2 != null ? file2.getOriginalFilename() : "null"));
            
            // Convertir JSON string a lista de DTOs
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            List<InCreatePaymentDTO> payments = mapper.readValue(paymentsJson, 
                mapper.getTypeFactory().constructCollectionType(List.class, InCreatePaymentDTO.class));
            
            System.out.println("Parsed payments count: " + payments.size());
            
            // Crear array de archivos
            List<MultipartFile> filesList = new ArrayList<>();
            if (file1 != null) filesList.add(file1);
            if (file2 != null) filesList.add(file2);
            if (file3 != null) filesList.add(file3);
            if (file4 != null) filesList.add(file4);
            if (file5 != null) filesList.add(file5);
            
            MultipartFile[] files = filesList.toArray(new MultipartFile[0]);
            System.out.println("Files count: " + files.length);
            
            paymentService.saveAllWithFilesFromArray(payments, files);
            return new ResponseEntity<>("Pagos creados exitosamente", HttpStatus.CREATED);
        } catch (Exception e) {
            System.err.println("Error processing batch payment: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>("Error: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

}
