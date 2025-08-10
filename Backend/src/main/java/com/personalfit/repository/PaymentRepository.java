package com.personalfit.repository;

import com.personalfit.enums.PaymentStatus;
import com.personalfit.models.Payment;
import com.personalfit.models.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByConfNumber(Long confNumber);
    Optional<Payment> findTopByUserOrderByCreatedAtDesc(User u);

    Optional<Payment> findTopByUserAndStatusOrderByCreatedAtDesc(User user, PaymentStatus status);
}
