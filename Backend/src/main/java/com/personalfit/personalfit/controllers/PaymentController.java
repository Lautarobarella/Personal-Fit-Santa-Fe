package com.personalfit.personalfit.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.personalfit.personalfit.dto.InCreatePaymentDTO;
import com.personalfit.personalfit.dto.PaymentTypeDTO;
import com.personalfit.personalfit.dto.VerifyPaymentTypeDTO;
import com.personalfit.personalfit.services.IPaymentService;

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    @Autowired
    private IPaymentService IPaymentService;

    @PostMapping
    public ResponseEntity<Void> newPayment(@RequestBody InCreatePaymentDTO payment) {
        IPaymentService.registerPayment(payment);
        return ResponseEntity.created(null).build();
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<PaymentTypeDTO>> getAllPayments() {
        return ResponseEntity.ok(IPaymentService.getAllPaymentsTypeDto());
    }

    @GetMapping("/{id}")
    public ResponseEntity<List<PaymentTypeDTO>> getUserPayments(@PathVariable Long id) {
        return ResponseEntity.ok(IPaymentService.getUserPaymentsTypeDto(id));
    }

    @GetMapping("/info/{id}")
    public ResponseEntity<VerifyPaymentTypeDTO> getPaymentInfo(@PathVariable Long id) {
        return ResponseEntity.ok(IPaymentService.getVerifyPaymentTypeDto(id));
    }

    // batch function to save multiple payments
    @Transactional
    @PostMapping("/batch")
    public ResponseEntity<Void> savePayments(@Valid @RequestBody List<InCreatePaymentDTO> newPayments) {
        IPaymentService.saveAll(newPayments);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }

}
