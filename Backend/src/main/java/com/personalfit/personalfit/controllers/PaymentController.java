package com.personalfit.personalfit.controllers;

import com.personalfit.personalfit.dto.InCreatePaymentDTO;
import com.personalfit.personalfit.dto.InUpdatePaymentStatusDTO;
import com.personalfit.personalfit.dto.PaymentTypeDTO;
import com.personalfit.personalfit.models.Payment;
import com.personalfit.personalfit.models.PaymentFile;
import com.personalfit.personalfit.services.IPaymentFileService;
import com.personalfit.personalfit.services.IPaymentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

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

}
