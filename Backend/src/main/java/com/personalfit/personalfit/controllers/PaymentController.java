package com.personalfit.personalfit.controllers;

import com.personalfit.personalfit.dto.InCreatePaymentDTO;
import com.personalfit.personalfit.dto.PaymentTypeDTO;
import com.personalfit.personalfit.dto.RejectPaymentDTO;
import com.personalfit.personalfit.dto.VerifyPaymentTypeDTO;
import com.personalfit.personalfit.services.IPaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    @Autowired
    private IPaymentService paymentService;

    @PostMapping
    public ResponseEntity<Void> newPayment(@RequestBody InCreatePaymentDTO payment) {
        paymentService.registerPayment(payment);
        return ResponseEntity.created(null).build();
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<PaymentTypeDTO>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPaymentsTypeDto());
    }

    @GetMapping("/info/{id}")
    public ResponseEntity<VerifyPaymentTypeDTO> getPaymentInfo(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getVerifyPaymentTypeDto(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<List<PaymentTypeDTO>> getUserPayments(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getUserPaymentsTypeDto(id));
    }

    @PutMapping("/pending/{id}")
    public ResponseEntity<Void> setPaymentPending(@PathVariable Long id) {
        paymentService.setPaymentPending(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/verify/{id}")
    public ResponseEntity<Void> verifyPayment(@PathVariable Long id, @RequestBody Long userId) {
        paymentService.verifyPayment(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/reject/{id}")
    public ResponseEntity<Void> rejectPayment(@PathVariable Long id, @RequestBody RejectPaymentDTO reason) {
        paymentService.rejectPayment(id, reason);
        return ResponseEntity.noContent().build();
    }

}
