package com.personalfit.personalfit.services;

import com.personalfit.personalfit.dto.InCreatePaymentDTO;
import com.personalfit.personalfit.dto.InUpdatePaymentStatusDTO;
import com.personalfit.personalfit.dto.PaymentTypeDTO;
import com.personalfit.personalfit.models.Payment;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IPaymentService {
    void registerPayment(InCreatePaymentDTO newPayment);
    List<PaymentTypeDTO> getAllPaymentsTypeDto();
    List<PaymentTypeDTO> getUserPaymentsTypeDto(Long id);
    void registerPaymentWithFile(InCreatePaymentDTO newPayment, MultipartFile file);
    Boolean saveAll(List<InCreatePaymentDTO> newPayments);
    void updatePaymentStatus(Long id, InUpdatePaymentStatusDTO dto);
    PaymentTypeDTO getPaymentById(Long id);
    Payment getPaymentWithFileById(Long id);
}
