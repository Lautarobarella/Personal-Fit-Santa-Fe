package com.personalfit.personalfit.models;

import com.personalfit.personalfit.utils.MethodType;
import com.personalfit.personalfit.utils.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;
    private Long confNumber;
    private String rejectionReason;
    private Double amount;
    @Enumerated(EnumType.STRING)
    private MethodType methodType;
    private LocalDateTime createdAt;
    private LocalDateTime verifiedAt; // Fecha de verificación del pago
    private LocalDateTime updatedAt; // Fecha de actualización del pago
    private LocalDateTime expiresAt; // Fecha de expiración del pago
    @OneToOne
    @JoinColumn(name = "verified_by_user_id")
    private User verifiedBy;
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    @Enumerated(EnumType.STRING)
    private PaymentStatus status;
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "payment_file_id")
    private PaymentFile paymentFile; // Comprobante de pago asociado

}
