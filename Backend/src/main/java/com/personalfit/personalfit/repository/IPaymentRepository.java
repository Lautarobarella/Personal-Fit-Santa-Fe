package com.personalfit.personalfit.repository;

import com.personalfit.personalfit.models.Payment;
import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.utils.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IPaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByConfNumber(Long confNumber);
    Optional<Payment> findTopByUserOrderByCreatedAtDesc(User u);

    Optional<Payment> findTopByUserAndStatusOrderByCreatedAtDesc(User user, PaymentStatus status);
}
