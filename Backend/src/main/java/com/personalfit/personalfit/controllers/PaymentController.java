package com.personalfit.personalfit.controllers;

import java.util.List;

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
@RequestMapping("/api/payment")
public class PaymentController {

    @Autowired
    private IPaymentService paymentService;

    @Autowired
    private IPaymentFileService fileService;

    // DEPRECATED
    @PostMapping
    public ResponseEntity<Void> newPayment(@RequestBody InCreatePaymentDTO payment) {
        paymentService.registerPayment(payment);
        return ResponseEntity.created(null).build();
    }

    @PostMapping(value = "/new", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> newPaymentWithFile(
            @RequestPart("payment") InCreatePaymentDTO payment,
            @RequestPart(value = "file", required = false) MultipartFile file) {

        paymentService.registerPaymentWithFile(payment, file);
        return ResponseEntity.created(null).build();
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
    public ResponseEntity<String> putPayment(
            @PathVariable Long id,
            @RequestBody InUpdatePaymentStatusDTO dto) {
        paymentService.updatePaymentStatus(id, dto);
        return ResponseEntity.ok("Estado actualizado correctamente");
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
    public ResponseEntity<Void> savePaymentsWithFiles(
            @RequestPart("payments") String paymentsJson,
            @RequestPart("files") MultipartFile[] files) {
        
        try {
            // Convertir JSON string a lista de DTOs
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            List<InCreatePaymentDTO> payments = mapper.readValue(paymentsJson, 
                mapper.getTypeFactory().constructCollectionType(List.class, InCreatePaymentDTO.class));
            
            paymentService.saveAllWithFilesFromArray(payments, files);
            return new ResponseEntity<>(HttpStatus.CREATED);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

}
