package com.personalfit.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.personalfit.enums.PaymentStatus;
import com.personalfit.models.Payment;
import com.personalfit.models.User;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    // ===== CONSULTAS BÁSICAS =====
    Optional<Payment> findByConfNumber(Long confNumber);

    List<Payment> findByStatus(PaymentStatus status);

    // ===== CONSULTAS POR USUARIO CON FETCH JOINS OPTIMIZADAS =====

    /**
     * Obtiene el último pago de un usuario con información completa
     */
    @Query("SELECT p FROM Payment p " +
            "JOIN p.users u " +
            "WHERE u = :user " +
            "ORDER BY p.createdAt DESC " +
            "LIMIT 1")
    Optional<Payment> findTopByUserOrderByCreatedAtDesc(@Param("user") User user);

    /**
     * Obtiene el último pago de un usuario con estado específico
     */
    @Query("SELECT p FROM Payment p " +
            "JOIN p.users u " +
            "WHERE u = :user AND p.status = :status " +
            "ORDER BY p.createdAt DESC " +
            "LIMIT 1")
    Optional<Payment> findTopByUserAndStatusOrderByCreatedAtDesc(@Param("user") User user,
            @Param("status") PaymentStatus status);

    /**
     * Obtiene todos los pagos de un usuario específico ordenados por fecha
     */
    @Query("SELECT DISTINCT p FROM Payment p " +
            "JOIN p.users u " +
            "LEFT JOIN FETCH p.paymentFile " +
            "WHERE u.id = :userId " +
            "ORDER BY p.createdAt DESC")
    List<Payment> findAllByUserIdWithDetails(@Param("userId") Long userId);

    /**
     * Verifica si existe un pago para un usuario específico
     */
    @Query("SELECT COUNT(p) > 0 FROM Payment p " +
            "JOIN p.users u " +
            "WHERE p.id = :paymentId AND u.id = :userId")
    boolean existsByPaymentIdAndUserId(@Param("paymentId") Long paymentId, @Param("userId") Long userId);

    // ===== CONSULTAS PARA MÚLTIPLES USUARIOS =====

    /**
     * Obtiene todos los pagos con múltiples usuarios
     */
    @Query("SELECT DISTINCT p FROM Payment p " +
            "JOIN FETCH p.users u " +
            "LEFT JOIN FETCH p.paymentFile " +
            "WHERE SIZE(p.users) > 1 " +
            "ORDER BY p.createdAt DESC")
    List<Payment> findAllMultiUserPayments();

    // ===== CONSULTAS PARA ADMINISTRACIÓN =====

    /**
     * Obtiene todos los pagos del mes actual para el panel de administración
     */
    @Query("SELECT DISTINCT p FROM Payment p " +
            "JOIN FETCH p.users u " +
            "LEFT JOIN FETCH p.paymentFile " +
            "WHERE p.createdAt >= :startOfMonth AND p.createdAt < :endOfMonth " +
            "ORDER BY p.createdAt DESC")
    List<Payment> findAllPaymentsInMonth(@Param("startOfMonth") LocalDateTime startOfMonth,
            @Param("endOfMonth") LocalDateTime endOfMonth);

    /**
     * Obtiene pagos que expiran hoy para la tarea de verificación automática
     */
    @Query("SELECT DISTINCT p FROM Payment p " +
            "JOIN FETCH p.users u " +
            "WHERE p.status = 'PAID' " +
            "AND p.expiresAt >= :startOfDay " +
            "AND p.expiresAt < :endOfDay")
    List<Payment> findPaidPaymentsExpiringToday(@Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay);

    // ===== CONSULTAS PARA INGRESOS =====

    /**
     * Calcula el total de ingresos confirmados en un período
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0.0) FROM Payment p " +
            "WHERE p.status = 'PAID' " +
            "AND p.verifiedAt >= :startDate AND p.verifiedAt < :endDate")
    Double calculateConfirmedRevenueInPeriod(@Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
}
