package com.personalfit.models;

import java.time.LocalDateTime;
import java.util.Set;

import com.personalfit.enums.MethodType;
import com.personalfit.enums.PaymentStatus;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"users"})
@ToString(exclude = {"users"})
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long confNumber;
    private String rejectionReason;
    private String notes; // Notas adicionales del pago (especialmente para efectivo)
    private Double amount;
    @Enumerated(EnumType.STRING)
    private MethodType methodType;
    private LocalDateTime createdAt;
    private LocalDateTime verifiedAt; // Fecha de verificación del pago
    private LocalDateTime updatedAt; // Fecha de actualización del pago
    private LocalDateTime expiresAt; // Fecha de expiración del pago
    @ManyToOne
    @JoinColumn(name = "verified_by_user_id")
    private User verifiedBy;
    @ManyToOne
    @JoinColumn(name = "created_by_user_id")
    private User createdBy; // Usuario que creó el pago
    @Enumerated(EnumType.STRING)
    private PaymentStatus status;
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "payment_file_id")
    private PaymentFile paymentFile; // Comprobante de pago asociado

    // Relación many-to-many directa con usuarios
    @ManyToMany
    @JoinTable(
        name = "payment_users",
        joinColumns = @JoinColumn(name = "payment_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> users;


}
