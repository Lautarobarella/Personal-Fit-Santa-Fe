package com.personalfit.personalfit.services;

import com.personalfit.personalfit.repository.IPaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {

    @Autowired
    private IPaymentRepository paymentRepository;

}
