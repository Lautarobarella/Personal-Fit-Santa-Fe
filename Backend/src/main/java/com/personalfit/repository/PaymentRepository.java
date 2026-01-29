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

        // ===== BASIC QUERIES =====
        Optional<Payment> findByConfNumber(Long confNumber);

        List<Payment> findByStatus(PaymentStatus status);

        // ===== USER QUERIES WITH OPTIMIZED FETCH JOINS =====

        /**
         * Retrieves the latest payment for a user with full details.
         */
        @Query("SELECT p FROM Payment p " +
                        "JOIN p.users u " +
                        "WHERE u = :user " +
                        "ORDER BY p.createdAt DESC " +
                        "LIMIT 1")
        Optional<Payment> findTopByUserOrderByCreatedAtDesc(@Param("user") User user);

        /**
         * Retrieves the latest payment for a user with a specific status.
         */
        @Query("SELECT p FROM Payment p " +
                        "JOIN p.users u " +
                        "WHERE u = :user AND p.status = :status " +
                        "ORDER BY p.createdAt DESC " +
                        "LIMIT 1")
        Optional<Payment> findTopByUserAndStatusOrderByCreatedAtDesc(@Param("user") User user,
                        @Param("status") PaymentStatus status);

        /**
         * Retrieves all payments for a specific user, ordered by date.
         * Fetches associated payment files.
         */
        @Query("SELECT DISTINCT p FROM Payment p " +
                        "JOIN p.users u " +
                        "LEFT JOIN FETCH p.paymentFile " +
                        "WHERE u.id = :userId " +
                        "ORDER BY p.createdAt DESC")
        List<Payment> findAllByUserIdWithDetails(@Param("userId") Long userId);

        /**
         * Retrieves all payments for a specific user with a specific status.
         */
        @Query("SELECT DISTINCT p FROM Payment p " +
                        "JOIN p.users u " +
                        "WHERE u = :user AND p.status = :status " +
                        "ORDER BY p.createdAt DESC")
        List<Payment> findByUserAndStatus(@Param("user") User user, @Param("status") PaymentStatus status);

        /**
         * Checks if a payment exists for a specific user.
         */
        @Query("SELECT COUNT(p) > 0 FROM Payment p " +
                        "JOIN p.users u " +
                        "WHERE p.id = :paymentId AND u.id = :userId")
        boolean existsByPaymentIdAndUserId(@Param("paymentId") Long paymentId, @Param("userId") Long userId);

        // ===== MULTI-USER QUERIES =====

        /**
         * Retrieves all payments involving multiple users.
         */
        @Query("SELECT DISTINCT p FROM Payment p " +
                        "JOIN FETCH p.users u " +
                        "LEFT JOIN FETCH p.paymentFile " +
                        "WHERE SIZE(p.users) > 1 " +
                        "ORDER BY p.createdAt DESC")
        List<Payment> findAllMultiUserPayments();

        // ===== ADMIN QUERIES =====

        /**
         * Retrieves all payments for the current month for the admin dashboard.
         */
        @Query("SELECT DISTINCT p FROM Payment p " +
                        "JOIN FETCH p.users u " +
                        "LEFT JOIN FETCH p.paymentFile " +
                        "WHERE p.createdAt >= :startOfMonth AND p.createdAt < :endOfMonth " +
                        "ORDER BY p.createdAt DESC")
        List<Payment> findAllPaymentsInMonth(@Param("startOfMonth") LocalDateTime startOfMonth,
                        @Param("endOfMonth") LocalDateTime endOfMonth);

        /**
         * Retrieves paid payments expiring today (for auto-verification task).
         */
        @Query("SELECT DISTINCT p FROM Payment p " +
                        "JOIN FETCH p.users u " +
                        "WHERE p.status = 'PAID' " +
                        "AND p.expiresAt >= :startOfDay " +
                        "AND p.expiresAt < :endOfDay")
        List<Payment> findPaidPaymentsExpiringToday(@Param("startOfDay") LocalDateTime startOfDay,
                        @Param("endOfDay") LocalDateTime endOfDay);

        // ===== REVENUE QUERIES =====

        /**
         * Calculates total confirmed revenue within a period.
         */
        @Query("SELECT COALESCE(SUM(p.amount), 0.0) FROM Payment p " +
                        "WHERE p.status = 'PAID' " +
                        "AND p.verifiedAt >= :startDate AND p.verifiedAt < :endDate")
        Double calculateConfirmedRevenueInPeriod(@Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate);
}
