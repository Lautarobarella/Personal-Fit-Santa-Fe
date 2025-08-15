package com.personalfit.models;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entidad para registrar los ingresos mensuales del gimnasio
 * Se actualiza automáticamente cada vez que se confirma un pago
 * y se archiva al final de cada mes
 */
@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "monthly_revenue", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"year", "month"})
})
public class MonthlyRevenue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer year;
    private Integer month;
    private Double totalRevenue;
    private Integer totalPayments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime archivedAt; // Fecha de archivado (fin de mes)

    public void addRevenue(Double amount) {
        this.totalRevenue = (this.totalRevenue != null ? this.totalRevenue : 0.0) + amount;
        this.totalPayments = (this.totalPayments != null ? this.totalPayments : 0) + 1;
        this.updatedAt = LocalDateTime.now();
    }
}
