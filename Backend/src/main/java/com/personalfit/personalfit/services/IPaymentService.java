package com.personalfit.personalfit.services;

import com.personalfit.personalfit.dto.InCreatePaymentDTO;
import com.personalfit.personalfit.dto.PaymentTypeDTO;
import com.personalfit.personalfit.dto.RejectPaymentDTO;
import com.personalfit.personalfit.dto.VerifyPaymentTypeDTO;
import com.personalfit.personalfit.exceptions.NoUserWithIdException;
import com.personalfit.personalfit.models.Payment;
import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.repository.IPaymentRepository;
import com.personalfit.personalfit.utils.PaymentStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface IPaymentService {
    void registerPayment(InCreatePaymentDTO newPayment);
    List<PaymentTypeDTO> getAllPaymentsTypeDto();
    VerifyPaymentTypeDTO getVerifyPaymentTypeDto(Long id);
    List<PaymentTypeDTO> getUserPaymentsTypeDto(Long id);
    void setPaymentPending(Long id);
    void verifyPayment(Long id, Long userId);
    void rejectPayment(Long id, RejectPaymentDTO reason);
    void registerPaymentWithFile(InCreatePaymentDTO newPayment, MultipartFile file);
    Boolean saveAll(List<InCreatePaymentDTO> newPayments);
}
