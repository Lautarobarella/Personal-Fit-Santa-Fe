package com.personalfit.personalfit.repository;

import com.personalfit.personalfit.models.PaymentFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IPaymentFileRepository extends JpaRepository<PaymentFile, Long> {
}
