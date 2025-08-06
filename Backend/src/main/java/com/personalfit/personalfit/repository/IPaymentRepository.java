package com.personalfit.personalfit.repository;

import com.personalfit.personalfit.models.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IPaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByConfNumber(Long confNumber);
}
