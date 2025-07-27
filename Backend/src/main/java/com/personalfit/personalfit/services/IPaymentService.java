package com.personalfit.personalfit.services;

import com.personalfit.personalfit.dto.InCreatePaymentDTO;
import com.personalfit.personalfit.dto.PaymentTypeDTO;
import com.personalfit.personalfit.dto.VerifyPaymentTypeDTO;
import com.personalfit.personalfit.exceptions.NoUserWithIdException;
import com.personalfit.personalfit.models.Payment;
import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.repository.IPaymentRepository;
import com.personalfit.personalfit.utils.PaymentStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface IPaymentService {
    void registerPayment(InCreatePaymentDTO newPayment);
    List<PaymentTypeDTO> getAllPaymentsTypeDto();
    VerifyPaymentTypeDTO getVerifyPaymentTypeDto(Long id);
    List<PaymentTypeDTO> getUserPaymentsTypeDto(Long id);
}
