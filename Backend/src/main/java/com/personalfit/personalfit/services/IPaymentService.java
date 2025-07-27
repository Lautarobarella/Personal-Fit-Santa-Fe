package com.personalfit.personalfit.services;

import java.util.List;

import com.personalfit.personalfit.dto.InCreatePaymentDTO;
import com.personalfit.personalfit.dto.PaymentTypeDTO;
import com.personalfit.personalfit.dto.VerifyPaymentTypeDTO;

public interface IPaymentService {
    Boolean registerPayment(InCreatePaymentDTO newPayment);

    List<PaymentTypeDTO> getAllPaymentsTypeDto();

    VerifyPaymentTypeDTO getVerifyPaymentTypeDto(Long id);

    Boolean saveAll(List<InCreatePaymentDTO> newPayments);

    List<PaymentTypeDTO> getUserPaymentsTypeDto(Long id);
}
